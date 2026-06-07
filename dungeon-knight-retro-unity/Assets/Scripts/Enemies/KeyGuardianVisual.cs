using UnityEngine;

namespace DungeonKnight.Enemies
{
    public class KeyGuardianVisual : MonoBehaviour
    {
        private SpriteRenderer aura;
        private SpriteRenderer floorSigil;
        private SpriteRenderer crownGlow;
        private SpriteRenderer shoulderGlow;
        private float phase;

        private void Awake()
        {
            transform.localScale *= 1.22f;
            if (TryGetComponent(out SpriteRenderer renderer))
            {
                renderer.color = new Color(1f, 0.86f, 0.62f);
            }

            aura = CreateChild("Guardian Aura", new Vector2(0f, 0.15f), new Vector2(1.85f, 2.2f), new Color(1f, 0.68f, 0.18f, 0.12f), 1);
            floorSigil = CreateChild("Guardian Floor Sigil", new Vector2(0f, -0.72f), new Vector2(1.55f, 0.16f), new Color(1f, 0.72f, 0.22f, 0.42f), 2);
            crownGlow = CreateChild("Guardian Helm Glow", new Vector2(0.08f, 0.73f), new Vector2(0.42f, 0.12f), new Color(1f, 0.86f, 0.24f, 0.75f), 9);
            shoulderGlow = CreateChild("Guardian Shoulder Glow", new Vector2(0f, 0.28f), new Vector2(1.18f, 0.08f), new Color(1f, 0.72f, 0.18f, 0.42f), 9);
        }

        private void Update()
        {
            phase += Time.deltaTime;
            if (aura)
            {
                aura.color = new Color(1f, 0.68f, 0.18f, 0.1f + Mathf.Sin(phase * 4.2f) * 0.045f);
                aura.transform.localScale = new Vector2(1.75f + Mathf.Sin(phase * 2.6f) * 0.12f, 2.08f + Mathf.Cos(phase * 2.2f) * 0.1f);
            }

            if (floorSigil)
            {
                floorSigil.transform.localScale = new Vector2(1.55f + Mathf.Sin(phase * 3f) * 0.12f, 0.16f);
                floorSigil.color = new Color(1f, 0.72f, 0.22f, 0.3f + Mathf.Sin(phase * 5.4f) * 0.12f);
            }

            if (crownGlow)
            {
                crownGlow.color = new Color(1f, 0.86f, 0.24f, 0.55f + Mathf.Sin(phase * 7f) * 0.22f);
            }

            if (shoulderGlow)
            {
                shoulderGlow.color = new Color(1f, 0.72f, 0.18f, 0.32f + Mathf.Sin(phase * 5f) * 0.13f);
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
