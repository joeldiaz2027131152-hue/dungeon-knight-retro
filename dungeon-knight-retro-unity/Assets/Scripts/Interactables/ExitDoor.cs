using DungeonKnight.Level;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class ExitDoor : MonoBehaviour, IInteractable
    {
        [SerializeField] private bool requiresGateKey;
        [SerializeField] private bool returnsToWorldOneOne;
        [SerializeField] private bool returnsToWorldOneTwo;
        private bool unlocked;

        public string Prompt => returnsToWorldOneOne || returnsToWorldOneTwo ? "Volver" : requiresGateKey && !unlocked ? "Abrir porton" : "Entrar";

        public void RequireGateKey()
        {
            requiresGateKey = true;
        }

        public void ReturnToWorldOneOne()
        {
            returnsToWorldOneOne = true;
        }

        public void ReturnToWorldOneTwo()
        {
            returnsToWorldOneTwo = true;
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
            if (returnsToWorldOneOne)
            {
                GameSession.Instance?.ReturnToWorldOneOne();
                return;
            }

            if (returnsToWorldOneTwo)
            {
                GameSession.Instance?.ReturnToWorldOneTwo();
                return;
            }

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
