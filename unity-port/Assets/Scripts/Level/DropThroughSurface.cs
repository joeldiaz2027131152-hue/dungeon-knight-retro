using UnityEngine;

namespace DungeonKnight.Level
{
    public class DropThroughSurface : MonoBehaviour
    {
        [SerializeField] private bool oneWayFromBelow;
        [SerializeField] private bool slopedSurface;
        [SerializeField] private bool ascendingRight = true;
        private Collider2D surfaceCollider;
        private Collider2D playerCollider;
        private Rigidbody2D playerBody;
        private float forceIgnoreUntil;

        public void Configure(bool allowOneWayFromBelow, bool isSlopedSurface = false, bool risesToRight = true)
        {
            oneWayFromBelow = allowOneWayFromBelow;
            slopedSurface = isSlopedSurface;
            ascendingRight = risesToRight;
        }

        public void IgnorePlayerUntil(float time)
        {
            EnsurePlayer();
            forceIgnoreUntil = Mathf.Max(forceIgnoreUntil, time);
            if (surfaceCollider && playerCollider)
            {
                Physics2D.IgnoreCollision(playerCollider, surfaceCollider, true);
            }
        }

        private void Awake()
        {
            surfaceCollider = GetComponent<Collider2D>();
        }

        private void Update()
        {
            if (!oneWayFromBelow) return;
            if (!surfaceCollider) return;
            EnsurePlayer();
            if (!playerCollider || !playerBody) return;

            if (Time.time < forceIgnoreUntil)
            {
                Physics2D.IgnoreCollision(playerCollider, surfaceCollider, true);
                return;
            }

            Bounds playerBounds = playerCollider.bounds;
            float playerFeet = playerBounds.min.y;
            float playerHead = playerBounds.max.y;
            float surfaceTop = GetSurfaceTopAt(playerCollider.bounds.center.x);
            bool movingUp = playerBody.linearVelocity.y > 0.05f;
            bool bodyIsAboveSurface = playerHead > surfaceTop + 0.18f;
            bool feetNearLandingZone = playerFeet >= surfaceTop - 0.42f;
            bool canLandOrStand = !movingUp && bodyIsAboveSurface && feetNearLandingZone;
            bool shouldIgnore = !canLandOrStand;
            Physics2D.IgnoreCollision(playerCollider, surfaceCollider, shouldIgnore);
        }

        private float GetSurfaceTopAt(float worldX)
        {
            Bounds bounds = surfaceCollider.bounds;
            if (!slopedSurface) return bounds.max.y;

            float t = Mathf.InverseLerp(bounds.min.x, bounds.max.x, worldX);
            t = Mathf.Clamp01(t);
            return ascendingRight
                ? Mathf.Lerp(bounds.min.y, bounds.max.y, t)
                : Mathf.Lerp(bounds.max.y, bounds.min.y, t);
        }

        private void EnsurePlayer()
        {
            if (playerCollider && playerBody) return;

            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (!player) return;

            playerCollider = player.GetComponent<Collider2D>();
            playerBody = player.GetComponent<Rigidbody2D>();
        }
    }
}
