use crate::result::{Result, error_response};
use uuid::Uuid;

pub fn parse_uuid(s: &str) -> Result<Uuid> {
    match Uuid::parse_str(s) {
        Ok(s) => Ok(s),
        Err(_) => Err(error_response(format!("Invalid uuid {s}"))),
    }
}
