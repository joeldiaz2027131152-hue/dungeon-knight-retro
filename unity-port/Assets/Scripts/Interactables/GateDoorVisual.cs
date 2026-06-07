using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class GateDoorVisual : MonoBehaviour
    {
        private SpriteRenderer doorRenderer;
        private SpriteRenderer lockRenderer;
        private SpriteRenderer lockCoreRenderer;
        private SpriteRenderer sealRenderer;
        private SpriteRenderer barRenderer;
        private Vector3 lockBaseScale;
        private Vector3 lockBasePosition;
        private Color closedColor = new Color(0.72f, 0.66f, 0.56f);
        private Color openColor = new Color(1f, 0.9f, 0.58f);
        private bool unlocked;
        private float pulse;
        private float lockedShake;
        private float keyReadyTimer;

        private void Awake()
        {
            doorRenderer = GetComponent<SpriteRenderer>();

            sealRenderer = CreateChildSprite("Gate Seal Ring", new Vector2(0f, 0.18f), new Vector2(0.86f, 0.86f), new Color(0.24f, 0.58f, 1f, 0.16f), 4);
            CreateChildSprite("Gate Seal Cross A", new Vector2(0f, 0.18f), new Vector2(0.92f, 0.055f), new Color(0.24f, 0.58f, 1f, 0.2f), 5);
            CreateChildSprite("Gate Seal Cross B", new Vector2(0f, 0.18f), new Vector2(0.055f, 0.92f), new Color(0.24f, 0.58f, 1f, 0.2f), 5);
            barRenderer = CreateChildSprite("Gate Iron Bar", new Vector2(0f, 0.42f), new Vector2(1.02f, 0.12f), new Color(0.12f, 0.12f, 0.15f, 0.95f), 6);
            lockRenderer = CreateChildSprite("Gate Lock", new Vector2(0.17f, 0.16f), new Vector2(0.34f, 0.38f), new Color(1f, 0.78f, 0.25f), 7);
            lockCoreRenderer = CreateChildSprite("Gate Lock Core", new Vector2(0.17f, 0.1f), new Vector2(0.12f, 0.12f), new Color(0.12f, 0.08f, 0.04f), 8);
            CreateChildSprite("Gate Lock Shackle", new Vector2(0.17f, 0.36f), new Vector2(0.22f, 0.12f), new Color(0.9f, 0.66f, 0.22f), 8);
            lockBaseScale = lockRenderer ? lockRenderer.transform.localScale : Vector3.one;
            lockBasePosition = lockRenderer ? lockRenderer.transform.localPosition : Vector3.zero;
            if (doorRenderer) doorRenderer.color = closedColor;
        }

        private void Update()
        {
            pulse += Time.deltaTime;
            if (sealRenderer)
            {
                sealRenderer.transform.rotation = Quaternion.Euler(0f, 0f, pulse * (unlocked ? 28f : 12f));
                sealRenderer.color = unlocked
                    ? new Color(1f, 0.78f, 0.3f, 0.18f + Mathf.Sin(pulse * 5f) * 0.04f)
                    : new Color(0.24f, 0.58f, 1f, 0.13f + Mathf.Sin(pulse * 3.6f) * 0.03f);
            }

            if (lockRenderer)
            {
                if (unlocked)
                {
                    float shrink = Mathf.Max(0.08f, lockRenderer.transform.localScale.x * 0.985f);
                    lockRenderer.transform.localScale = new Vector3(shrink, shrink, 1f);
                    lockRenderer.transform.localPosition = Vector2.Lerp(lockRenderer.transform.localPosition, new Vector2(0.34f, -0.32f), Time.deltaTime * 4f);
                    lockRenderer.transform.localRotation = Quaternion.Euler(0f, 0f, Mathf.LerpAngle(lockRenderer.transform.localEulerAngles.z, -24f, Time.deltaTime * 5f));
                }
                else
                {
                    lockedShake = Mathf.Max(0f, lockedShake - Time.deltaTime);
                    keyReadyTimer = Mathf.Max(0f, keyReadyTimer - Time.deltaTime);
                    float pulseSize = 1f + Mathf.Sin(pulse * 5.2f) * 0.035f;
                    if (keyReadyTimer > 0f)
                    {
                        pulseSize += 0.08f + Mathf.Sin(Time.time * 12f) * 0.04f;
                    }

                    lockRenderer.transform.localScale = lockBaseScale * pulseSize;
                    float shake = lockedShake > 0f ? Mathf.Sin(Time.time * 80f) * 0.055f * Mathf.Clamp01(lockedShake * 5f) : 0f;
                    lockRenderer.transform.localPosition = lockBasePosition + new Vector3(shake, 0f, 0f);
                    lockRenderer.color = keyReadyTimer > 0f
                        ? new Color(1f, 0.9f, 0.28f)
                        : new Color(1f, 0.78f, 0.25f);
                    if (lockCoreRenderer)
                    {
                        lockCoreRenderer.color = keyReadyTimer > 0f
                            ? new Color(0.35f, 0.18f, 0.02f)
                            : new Color(0.12f, 0.08f, 0.04f);
                    }
                }
            }
        }

        public void KeyReadyFeedback()
        {
            if (unlocked) return;
            bool shouldSpark = keyReadyTimer <= 0.08f;
            keyReadyTimer = 0.7f;
            if (shouldSpark)
            {
                HitBurst.Spawn(transform.position + new Vector3(0.18f, 0.18f, 0f), new Color(1f, 0.84f, 0.28f), 8);
            }
        }

        public void LockedFeedback()
        {
            if (unlocked) return;
            lockedShake = 0.38f;
            HitBurst.Spawn(transform.position + new Vector3(0.18f, 0.18f, 0f), new Color(0.28f, 0.65f, 1f), 12);
        }

        public void Unlock()
        {
            if (unlocked) return;
            unlocked = true;
            if (doorRenderer) doorRenderer.color = openColor;
            if (lockRenderer) lockRenderer.color = new Color(1f, 0.55f, 0.18f, 0.2f);
            if (lockCoreRenderer) lockCoreRenderer.color = new Color(0.12f, 0.08f, 0.04f, 0.2f);
            if (barRenderer) barRenderer.color = new Color(0.18f, 0.16f, 0.12f, 0.24f);
            HitBurst.Spawn(transform.position + new Vector3(0.05f, 0.3f, 0f), new Color(1f, 0.82f, 0.24f), 24);
        }

        private SpriteRenderer CreateChildSprite(string objectName, Vector2 localPosition, Vector2 size, Color color, int sortingOrder)
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
