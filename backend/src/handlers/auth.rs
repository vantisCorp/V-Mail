use actix_web::{web, HttpResponse, Responder};
use crate::models::{CreateUserRequest, LoginRequest, AuthResponse};
use crate::services::auth::AuthService;

pub async fn register(
    pool: web::Data<sqlx::PgPool>,
    req: web::Json<CreateUserRequest>,
) -> impl Responder {
    let auth_service = AuthService::new(pool.get_ref().clone());
    
    match auth_service.register(req.into_inner()).await {
        Ok(response) => HttpResponse::Created().json(response),
        Err(e) => HttpResponse::BadRequest().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

pub async fn login(
    pool: web::Data<sqlx::PgPool>,
    jwt_service: web::Data<crate::auth::jwt::JwtService>,
    req: web::Json<LoginRequest>,
) -> impl Responder {
    let auth_service = AuthService::new(pool.get_ref().clone());
    
    match auth_service.login(req.into_inner(), jwt_service.get_ref()).await {
        Ok(response) => HttpResponse::Ok().json(response),
        Err(e) => HttpResponse::Unauthorized().json(serde_json::json!({
            "error": e.to_string()
        })),
    }
}

pub async fn logout() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Logged out successfully"
    }))
}