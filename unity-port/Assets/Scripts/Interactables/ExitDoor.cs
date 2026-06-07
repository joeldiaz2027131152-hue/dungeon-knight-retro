using DungeonKnight.Level;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class ExitDoor : MonoBehaviour, IInteractable
    {
        [SerializeField] private bool requiresGateKey;
        private bool unlocked;

        public string Prompt => requiresGateKey && !unlocked ? "Abrir porton" : "Entrar";

        public void RequireGateKey()
        {
            requiresGateKey = true;
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            if (!requiresGateKey || unlocked || !other.CompareTag("Player")) return;
            if (!other.TryGetComponent(out PlayerInventory inventory) || !inventory.HasGateKey) return;

            if (TryGetComponent(out GateDoorVisual visual))
            {
                visual.KeyReadyFeedback();
            }
        }

        public void Interact(GameObject player)
        {
            if (requiresGateKey && !unlocked)
            {
                PlayerInventory inventory = player.GetComponent<PlayerInventory>();
                if (!inventory || !inventory.HasGateKey)
                {
                    InteractionFeedback.Show("El porton esta cerrado. El guardian de la catedral lleva la llave.");
                    RetroAudio.Play("locked");
                    if (TryGetComponent(out GateDoorVisual lockedVisual))
                    {
                        lockedVisual.LockedFeedback();
                    }

                    return;
                }

                InteractionFeedback.Show("La llave gira en la cerradura. El camino se abre.");
                RetroAudio.Play("unlock");
                unlocked = true;
                if (TryGetComponent(out GateDoorVisual doorVisual))
                {
                    doorVisual.KeyReadyFeedback();
                    doorVisual.Unlock();
                }
            }

            GameSession.Instance?.CompleteLevel();
        }
    }
}
