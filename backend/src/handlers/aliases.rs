use actix_web::{web, HttpResponse, Responder};
use uuid::Uuid;

pub async fn list_aliases(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "List aliases endpoint",
        "user_id": user_id
    }))
}

pub async fn create_alias(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    req: web::Json<crate::models::CreateAliasRequest>,
) -> impl Responder {
    HttpResponse::Created().json(serde_json::json!({
        "message": "Create alias endpoint",
        "user_id": user_id
    }))
}

pub async fn delete_alias(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    id: web::Path<Uuid>,
) -> impl Responder {
    HttpResponse::NoContent().finish()
}