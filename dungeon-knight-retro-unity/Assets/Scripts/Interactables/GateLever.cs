using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class GateLever : MonoBehaviour, IInteractable
    {
        private SimpleGate targetGate;
        private Transform handlePivot;
        private SpriteRenderer glowRenderer;
        private bool activated;

        public string Prompt => activated ? "Palanca activada" : "Activar palanca";

        public void Configure(SimpleGate gate, Transform handle = null, SpriteRenderer glow = null)
        {
            targetGate = gate;
            handlePivot = handle;
            glowRenderer = glow;
        }

        public void Interact(GameObject player)
        {
            if (activated)
            {
                InteractionFeedback.Show("La palanca ya esta fija.");
                return;
            }

            activated = true;
            if (handlePivot)
            {
                handlePivot.localRotation = Quaternion.Euler(0f, 0f, -52f);
            }
            if (glowRenderer)
            {
                glowRenderer.color = new Color(0.42f, 1f, 0.5f, 0.75f);
            }

            RetroAudio.Play("secret");
            targetGate?.Open();
        }
    }
}
