use actix_web::{web, HttpResponse, Responder};
use uuid::Uuid;

pub async fn list_emails(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "List emails endpoint",
        "user_id": user_id
    }))
}

pub async fn create_email(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    req: web::Json<crate::models::CreateEmailRequest>,
) -> impl Responder {
    HttpResponse::Created().json(serde_json::json!({
        "message": "Create email endpoint",
        "user_id": user_id
    }))
}

pub async fn get_email(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    id: web::Path<Uuid>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Get email endpoint",
        "user_id": user_id,
        "email_id": id.into_inner()
    }))
}

pub async fn update_email(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    id: web::Path<Uuid>,
    req: web::Json<crate::models::UpdateEmailRequest>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Update email endpoint",
        "user_id": user_id,
        "email_id": id.into_inner()
    }))
}

pub async fn delete_email(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    id: web::Path<Uuid>,
) -> impl Responder {
    HttpResponse::NoContent().finish()
}