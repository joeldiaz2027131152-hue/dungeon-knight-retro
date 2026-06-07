using UnityEngine;

namespace DungeonKnight.Level
{
    public class CameraFollow2D : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector2 offset = new Vector2(0.8f, 1.25f);
        [SerializeField] private float smoothTime = 0.14f;
        [SerializeField] private float lookAhead = 1.45f;
        [SerializeField] private float minY = 1.2f;
        [SerializeField] private Vector2 minBounds = new Vector2(-1f, 1.2f);
        [SerializeField] private Vector2 maxBounds = new Vector2(41f, 4.2f);
        [SerializeField] private bool useBounds = true;

        private Rigidbody2D targetBody;
        private Vector3 velocity;
        private Vector3 introStart;
        private float introTimer;
        private float introDuration;
        private float shakeTimer;
        private float shakeStrength;

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
            targetBody = target ? target.GetComponent<Rigidbody2D>() : null;
        }

        public void Configure(Vector2 newOffset, float newLookAhead, float newSmoothTime, Vector2 boundsMin, Vector2 boundsMax)
        {
            offset = newOffset;
            lookAhead = newLookAhead;
            smoothTime = newSmoothTime;
            minBounds = boundsMin;
            maxBounds = boundsMax;
            useBounds = true;
        }

        public void Shake(float duration, float strength)
        {
            shakeTimer = Mathf.Max(shakeTimer, duration);
            shakeStrength = Mathf.Max(shakeStrength, strength);
        }

        public void PlayIntro(Vector3 fromPosition, float duration)
        {
            introStart = fromPosition;
            introDuration = Mathf.Max(0.1f, duration);
            introTimer = introDuration;
            transform.position = introStart;
            velocity = Vector3.zero;
        }

        private void LateUpdate()
        {
            if (!target) return;

            float horizontalVelocity = targetBody ? targetBody.linearVelocity.x : 0f;
            float ahead = Mathf.Clamp(horizontalVelocity * 0.18f, -lookAhead, lookAhead);
            Vector3 desired = new Vector3(target.position.x + offset.x + ahead, Mathf.Max(minY, target.position.y + offset.y), -10f);
            if (useBounds)
            {
                desired.x = Mathf.Clamp(desired.x, minBounds.x, maxBounds.x);
                desired.y = Mathf.Clamp(desired.y, minBounds.y, maxBounds.y);
            }

            if (introTimer > 0f)
            {
                introTimer -= Time.unscaledDeltaTime;
                float t = 1f - Mathf.Clamp01(introTimer / introDuration);
                float eased = Mathf.SmoothStep(0f, 1f, t);
                desired = Vector3.Lerp(introStart, desired, eased);
            }

            if (shakeTimer > 0f)
            {
                shakeTimer -= Time.unscaledDeltaTime;
                Vector2 shake = Random.insideUnitCircle * shakeStrength * Mathf.Clamp01(shakeTimer * 12f);
                desired += new Vector3(shake.x, shake.y, 0f);
                if (shakeTimer <= 0f) shakeStrength = 0f;
            }

            transform.position = Vector3.SmoothDamp(transform.position, desired, ref velocity, smoothTime);
        }
    }
}
