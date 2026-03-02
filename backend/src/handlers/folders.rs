use actix_web::{web, HttpResponse, Responder};
use uuid::Uuid;

pub async fn list_folders(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "List folders endpoint",
        "user_id": user_id
    }))
}

pub async fn create_folder(
    pool: web::Data<sqlx::PgPool>,
    user_id: web::ReqData<Uuid>,
    req: web::Json<crate::models::CreateFolderRequest>,
) -> impl Responder {
    HttpResponse::Created().json(serde_json::json!({
        "message": "Create folder endpoint",
        "user_id": user_id
    }))
}