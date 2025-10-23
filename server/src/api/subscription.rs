use anyhow::Result;
use rocket::futures::SinkExt;
use rocket::futures::stream::FusedStream;
use rocket::{Route, State};
use serde::Serialize;
use tokio::sync::broadcast::Sender;
use uuid::Uuid;
use ws::WebSocket;

pub type FeedWriter = Sender<UpdateEvent>;

#[derive(Serialize, Debug, Clone)]
pub enum UpdateKind {
    Create,
    Update,
    Destroy,
}

#[derive(Serialize, Debug, Clone)]
pub enum EntityType {
    Project,
    Task,
}

#[derive(Serialize, Debug, Clone)]
pub struct UpdateEvent {
    kind: UpdateKind,
    entity_id: Uuid,
    entity_type: EntityType,
}

impl UpdateEvent {
    pub fn broadcast(
        sender: &FeedWriter,
        kind: UpdateKind,
        entity_type: EntityType,
        entity_id: Uuid,
    ) -> Result<()> {
        println!("Sending to feed");
        match sender.send(UpdateEvent {
            kind,
            entity_id,
            entity_type,
        }) {
            Ok(_) => {}
            Err(e) => eprintln!("Failed to write to feed: {e:?}"),
        }
        Ok(())
    }
}

#[get("/subscribe")]
fn subscribe(ws: WebSocket, update_feed: &State<FeedWriter>) -> ws::Channel<'static> {
    let mut feed = update_feed.subscribe();

    ws.channel(move |mut stream| {
        Box::pin(async move {
            while let Ok(update) = feed.recv().await {
                if stream.is_terminated() {
                    return Ok(());
                }
                let message = match serde_json::to_string(&update) {
                    Ok(message) => message,
                    Err(e) => {
                        eprintln!("Failed to process update event. Event: {update:?} Error: {e:?}");
                        continue;
                    }
                };
                stream.send(message.into()).await?;
            }

            Ok(())
        })
    })
}

pub fn routes() -> Vec<Route> {
    routes![subscribe]
}
