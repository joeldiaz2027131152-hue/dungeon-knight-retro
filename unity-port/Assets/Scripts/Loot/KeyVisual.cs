using UnityEngine;

namespace DungeonKnight.Loot
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class KeyVisual : MonoBehaviour
    {
        private SpriteRenderer spriteRenderer;
        private SpriteRenderer beamRenderer;
        private SpriteRenderer haloRenderer;
        private Color baseColor;
        private Vector3 baseScale;
        private Vector3 basePosition;
        private float phase;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            baseColor = spriteRenderer.color;
            baseScale = transform.localScale;
            basePosition = transform.position;
            phase = Random.Range(0f, 10f);
            beamRenderer = CreateChild("Key Light Beam", new Vector2(0f, 0.42f), new Vector2(0.18f, 1.45f), new Color(1f, 0.8f, 0.22f, 0.24f), 7);
            haloRenderer = CreateChild("Key Halo", Vector2.zero, new Vector2(1.12f, 0.18f), new Color(1f, 0.84f, 0.25f, 0.34f), 8);
        }

        private void Update()
        {
            float pulse = 1f + Mathf.Sin((Time.time + phase) * 5.5f) * 0.12f;
            Vector3 position = transform.position;
            if (TryGetComponent(out Rigidbody2D body) && body.linearVelocity.sqrMagnitude < 0.1f)
            {
                position.y = basePosition.y + Mathf.Sin((Time.time + phase) * 2.6f) * 0.05f;
                transform.position = position;
            }
            else
            {
                basePosition = transform.position;
            }

            transform.localScale = baseScale * pulse;
            spriteRenderer.color = Color.Lerp(baseColor, new Color(1f, 0.92f, 0.48f), 0.35f + Mathf.Sin((Time.time + phase) * 7f) * 0.18f);
            if (beamRenderer)
            {
                beamRenderer.color = new Color(1f, 0.8f, 0.22f, 0.18f + Mathf.Sin((Time.time + phase) * 4f) * 0.07f);
            }

            if (haloRenderer)
            {
                haloRenderer.transform.localScale = new Vector2(1.12f + Mathf.Sin((Time.time + phase) * 5f) * 0.12f, 0.18f);
                haloRenderer.color = new Color(1f, 0.84f, 0.25f, 0.28f + Mathf.Sin((Time.time + phase) * 6f) * 0.1f);
            }
        }

        private SpriteRenderer CreateChild(string objectName, Vector2 localPosition, Vector2 size, Color color, int sortingOrder)
        {
            GameObject child = new GameObject(objectName);
            child.transform.SetParent(transform, false);
            child.transform.localPosition = localPosition;
            child.transform.localScale = size;

            SpriteRenderer renderer = child.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
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
