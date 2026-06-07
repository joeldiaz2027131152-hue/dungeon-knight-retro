using UnityEngine;

namespace DungeonKnight.Level
{
    [RequireComponent(typeof(SpriteRenderer))]
    public class LightningFlash : MonoBehaviour
    {
        [SerializeField] private float minDelay = 5.5f;
        [SerializeField] private float maxDelay = 11f;

        private SpriteRenderer spriteRenderer;
        private float nextFlash;
        private float flashTimer;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            ScheduleNext();
        }

        private void Update()
        {
            if (flashTimer > 0f)
            {
                flashTimer -= Time.deltaTime;
                float alpha = Mathf.Sin(Mathf.Clamp01(flashTimer / 0.22f) * Mathf.PI) * 0.34f;
                spriteRenderer.color = new Color(0.76f, 0.9f, 1f, alpha);
                return;
            }

            spriteRenderer.color = new Color(0.76f, 0.9f, 1f, 0f);
            nextFlash -= Time.deltaTime;
            if (nextFlash <= 0f)
            {
                flashTimer = 0.22f;
                ScheduleNext();
            }
        }

        private void ScheduleNext()
        {
            nextFlash = Random.Range(minDelay, maxDelay);
        }
    }
}
