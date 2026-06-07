using System.Collections;
using DungeonKnight.Loot;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class TreasureChest : MonoBehaviour, IInteractable
    {
        [SerializeField] private int coins = 5;
        private bool opened;
        private SimpleGate requiredGate;
        private Transform lidAccent;
        private Vector3 lidStartPosition;

        public string Prompt => opened ? "Cofre abierto" : "Abrir cofre";

        private void Awake()
        {
            lidAccent = CreateLidAccent().transform;
            lidStartPosition = lidAccent.localPosition;
        }

        public void SetCoins(int amount)
        {
            coins = Mathf.Max(0, amount);
        }

        public void RequireGate(SimpleGate gate)
        {
            requiredGate = gate;
        }

        public void Interact(GameObject player)
        {
            if (opened) return;
            if (requiredGate && !requiredGate.IsOpen)
            {
                RetroAudio.Play("locked");
                InteractionFeedback.Show("El cofre esta encerrado. Busca la palanca de la reja.");
                return;
            }

            opened = true;

            if (TryGetComponent(out SpriteRenderer renderer))
            {
                renderer.color = new Color(1f, 0.86f, 0.42f);
            }

            RetroAudio.Play("chest");
            HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(1f, 0.82f, 0.28f), 18);
            StartCoroutine(OpenBurst());
            LootSpawner.SpawnCoins(transform.position + Vector3.up * 0.45f, coins);
            InteractionFeedback.Show($"Cofre abierto: {coins} monedas.");
            Debug.Log($"Cofre abierto: +{coins} monedas.");
        }

        private IEnumerator OpenBurst()
        {
            Vector3 baseScale = transform.localScale;
            for (int i = 0; i < 8; i++)
            {
                float t = i / 7f;
                transform.localScale = baseScale * (1f + Mathf.Sin(t * Mathf.PI) * 0.08f);
                if (lidAccent)
                {
                    lidAccent.localPosition = lidStartPosition + new Vector3(0f, t * 0.28f, 0f);
                    lidAccent.localRotation = Quaternion.Euler(0f, 0f, -18f * t);
                }

                yield return new WaitForSeconds(0.03f);
            }

            transform.localScale = baseScale;
            if (TryGetComponent(out SpriteRenderer renderer))
            {
                renderer.color = new Color(0.42f, 0.25f, 0.12f);
            }
        }

        private SpriteRenderer CreateLidAccent()
        {
            GameObject lid = new GameObject("Chest Lid Accent");
            lid.transform.SetParent(transform, false);
            lid.transform.localPosition = new Vector2(0f, 0.18f);
            lid.transform.localScale = new Vector2(0.9f, 0.18f);

            SpriteRenderer renderer = lid.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = new Color(1f, 0.76f, 0.22f, 0.82f);
            renderer.sortingOrder = 5;
            return renderer;
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
