pub mod alias;
pub mod auth;
pub mod database;
pub mod email;
pub mod storage;
pub mod websocket;

pub use alias::{AliasService, DomainService, TimedAlias, ReverseAliasInfo, AliasStats, DomainConfig};
pub use auth::AuthService;
pub use database::{create_pool, run_migrations};
pub use email::{EmailService, SendEmailData};
pub use storage::{StorageService, FileData, StoredFileInfo, FileContent};
pub use websocket::{WsMessage, ClientsManager, websocket_route, notify_new_email, send_notification};
