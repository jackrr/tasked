use anyhow::Result;
use rocket::futures::SinkExt;
use rocket::futures::stream::FusedStream;
use rocket::tokio::select;
use rocket::{Route, Shutdown, State};
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
fn subscribe(
    ws: WebSocket,
    update_feed: &State<FeedWriter>,
    mut shutdown: Shutdown,
) -> ws::Channel<'static> {
    let mut feed = update_feed.subscribe();

    ws.channel(move |mut stream| {
        Box::pin(async move {
            // Process messages
            // On shutdown signal, terminate websocket stream and close request
            loop {
                select! {
                    update = feed.recv() => {
                        match update {
                            Err(_) => continue,
                            Ok(update) => {
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
                            },
                        }
                    },
                    _ = &mut shutdown => {
                        stream.close(None).await?;
                        break;
                    }
                }
            }

            Ok(())
        })
    })
}

pub fn routes() -> Vec<Route> {
    routes![subscribe]
}
