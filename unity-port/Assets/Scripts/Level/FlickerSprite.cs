using UnityEngine;

namespace DungeonKnight.Level
{
    public class FlickerSprite : MonoBehaviour
    {
        [SerializeField] private float speed = 10f;
        [SerializeField] private float strength = 0.12f;

        private SpriteRenderer spriteRenderer;
        private Color baseColor;
        private Vector3 baseScale;
        private float phase;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            baseColor = spriteRenderer ? spriteRenderer.color : Color.white;
            baseScale = transform.localScale;
            phase = Random.Range(0f, 10f);
        }

        private void Update()
        {
            float flicker = 1f + Mathf.Sin((Time.time + phase) * speed) * strength + Random.Range(-strength, strength) * 0.35f;
            transform.localScale = baseScale * flicker;

            if (spriteRenderer)
            {
                Color color = baseColor;
                color.a = Mathf.Clamp01(0.82f + (flicker - 1f) * 1.4f);
                spriteRenderer.color = color;
            }
        }
    }
}
