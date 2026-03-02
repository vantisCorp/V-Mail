use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::{ErrorUnauthorized, ErrorInternalServerError},
    Error, HttpMessage,
};
use futures_util::future::{ok, Ready};
use std::{
    future::{ready, Future},
    pin::Pin,
    rc::Rc,
};
use uuid::Uuid;

use super::jwt::JwtService;

/// Authentication middleware for Actix-web
pub struct AuthMiddleware {
    jwt_service: Rc<JwtService>,
}

impl AuthMiddleware {
    pub fn new(jwt_service: JwtService) -> Self {
        Self {
            jwt_service: Rc::new(jwt_service),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddlewareService {
            service: Rc::new(service),
            jwt_service: self.jwt_service.clone(),
        })
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
    jwt_service: Rc<JwtService>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let jwt_service = self.jwt_service.clone();
        let service = self.service.clone();

        Box::pin(async move {
            // Extract token from Authorization header
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok());

            let token = match auth_header {
                Some(header) if header.starts_with("Bearer ") => {
                    Some(&header[7..])
                }
                _ => None,
            };

            if let Some(token) = token {
                // Validate token
                match jwt_service.validate_token(token) {
                    Ok(claims) => {
                        // Extract user ID and add to request extensions
                        if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                            req.extensions_mut().insert(user_id);
                            req.extensions_mut().insert(claims.email);
                        }
                    }
                    Err(_) => {
                        return Err(ErrorUnauthorized("Invalid or expired token"));
                    }
                }
            } else {
                return Err(ErrorUnauthorized("Missing authorization token"));
            }

            service.call(req).await
        })
    }
}

/// Extract user ID from request extensions
pub fn get_user_id(req: &ServiceRequest) -> Result<Uuid, Error> {
    req.extensions()
        .get::<Uuid>()
        .copied()
        .ok_or_else(|| ErrorInternalServerError("User ID not found in request"))
}

/// Extract user email from request extensions
pub fn get_user_email(req: &ServiceRequest) -> Result<String, Error> {
    req.extensions()
        .get::<String>()
        .cloned()
        .ok_or_else(|| ErrorInternalServerError("User email not found in request"))
}