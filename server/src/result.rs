// "Vendored" from: https://docs.rs/rocket_anyhow/latest/src/rocket_anyhow/lib.rs.html#1-54
use rocket::Request;
use rocket::response::{self, Responder};

#[derive(Debug)]
pub struct Error(pub anyhow::Error);
pub type Result<T = ()> = std::result::Result<T, Error>;

impl<E> From<E> for Error
where
    E: Into<anyhow::Error>,
{
    fn from(error: E) -> Self {
        Error(error.into())
    }
}

impl<'r> Responder<'r, 'r> for Error {
    fn respond_to(self, request: &Request<'_>) -> response::Result<'static> {
        response::Debug(self.0).respond_to(request)
    }
}

pub fn error_response(msg: String) -> Error {
    Error(anyhow::Error::msg(msg))
}
