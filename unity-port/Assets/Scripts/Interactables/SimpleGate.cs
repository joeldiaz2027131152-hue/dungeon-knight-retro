using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class SimpleGate : MonoBehaviour
    {
        private Collider2D gateCollider;
        private SpriteRenderer[] renderers;
        private Vector3 closedLocalPosition;
        private bool opened;
        private float openTimer;

        public bool IsOpen => opened;

        private void Awake()
        {
            gateCollider = GetComponent<Collider2D>();
            renderers = GetComponentsInChildren<SpriteRenderer>();
            closedLocalPosition = transform.localPosition;
        }

        private void Update()
        {
            if (!opened) return;

            openTimer = Mathf.Min(1f, openTimer + Time.deltaTime * 2.8f);
            float alpha = Mathf.Lerp(1f, 0.18f, openTimer);
            float lift = Mathf.Lerp(0f, 1.3f, openTimer);
            transform.localPosition = closedLocalPosition + Vector3.up * lift;

            foreach (SpriteRenderer renderer in renderers)
            {
                if (!renderer) continue;
                Color color = renderer.color;
                color.a = alpha;
                renderer.color = color;
            }
        }

        public void Open()
        {
            if (opened) return;

            opened = true;
            if (gateCollider) gateCollider.enabled = false;
            RetroAudio.Play("unlock");
            HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(0.78f, 0.88f, 1f), 18);
            InteractionFeedback.Show("La reja antigua se abre.");
        }
    }
}
