using DungeonKnight.Player;
using DungeonKnight.Level;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class Bonfire : MonoBehaviour, IInteractable
    {
        private SpriteRenderer spriteRenderer;
        private SpriteRenderer glowRenderer;
        private SpriteRenderer ringRenderer;
        private bool lit;
        private float activationTimer;

        public string Prompt => "Descansar";

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();

            GameObject glow = new GameObject("Checkpoint Glow");
            glow.transform.SetParent(transform, false);
            glow.transform.localPosition = new Vector2(0f, 0.18f);
            glow.transform.localScale = new Vector2(1.55f, 1.45f);
            glowRenderer = glow.AddComponent<SpriteRenderer>();
            glowRenderer.sprite = WhitePixel();
            glowRenderer.color = new Color(1f, 0.42f, 0.1f, 0.12f);
            glowRenderer.sortingOrder = 1;

            GameObject ring = new GameObject("Checkpoint Ground Ring");
            ring.transform.SetParent(transform, false);
            ring.transform.localPosition = new Vector2(0f, -0.35f);
            ring.transform.localScale = new Vector2(1.2f, 0.14f);
            ringRenderer = ring.AddComponent<SpriteRenderer>();
            ringRenderer.sprite = WhitePixel();
            ringRenderer.color = new Color(1f, 0.62f, 0.18f, 0f);
            ringRenderer.sortingOrder = 1;
        }

        private void Update()
        {
            activationTimer = Mathf.Max(0f, activationTimer - Time.deltaTime);
            float pulse = 0.86f + Mathf.Sin(Time.time * (lit ? 5.8f : 3.2f)) * (lit ? 0.08f : 0.035f);
            if (spriteRenderer)
            {
                spriteRenderer.color = lit
                    ? Color.Lerp(new Color(1f, 0.78f, 0.38f), Color.white, pulse)
                    : Color.Lerp(new Color(0.82f, 0.56f, 0.3f), Color.white, pulse * 0.45f);
            }

            if (glowRenderer)
            {
                float igniteBoost = activationTimer > 0f ? Mathf.Sin((1f - activationTimer / 0.75f) * Mathf.PI) * 0.22f : 0f;
                float alpha = lit ? 0.2f + Mathf.Sin(Time.time * 4.5f) * 0.05f + igniteBoost : 0.1f;
                float scaleBoost = 1f + igniteBoost * 1.6f;
                glowRenderer.transform.localScale = new Vector2(1.55f * scaleBoost, 1.45f * scaleBoost);
                glowRenderer.color = new Color(1f, 0.48f, 0.13f, alpha);
            }

            if (ringRenderer)
            {
                float ringPulse = lit ? 0.2f + Mathf.Sin(Time.time * 3.4f) * 0.07f : 0f;
                if (activationTimer > 0f)
                {
                    ringPulse += activationTimer / 0.75f * 0.35f;
                }

                ringRenderer.transform.localScale = new Vector2(1.2f + Mathf.Sin(Time.time * 3.2f) * 0.12f, 0.14f);
                ringRenderer.color = new Color(1f, 0.62f, 0.18f, Mathf.Clamp01(ringPulse));
            }
        }

        public void Interact(GameObject player)
        {
            if (player.TryGetComponent(out PlayerController2D controller))
            {
                bool firstLight = !lit;
                lit = true;
                if (firstLight) activationTimer = 0.75f;
                controller.RestoreAtBonfire();
                GameSession.Instance?.SetCheckpoint(transform.position + new Vector3(0f, 0.38f, 0f));
                RetroAudio.Play(firstLight ? "checkpoint" : "bonfire");
                HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(1f, 0.55f, 0.12f), firstLight ? 18 : 9);
                if (spriteRenderer) spriteRenderer.color = firstLight ? new Color(1f, 0.88f, 0.5f) : Color.white;
                InteractionFeedback.Show(firstLight ? "Hoguera encendida. Checkpoint guardado." : "Hoguera: vida y stamina restauradas.");
                Debug.Log("Hoguera: vida y stamina restauradas.");
            }
        }

        private static Sprite WhitePixel()
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();
            return Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        }
    }
}
