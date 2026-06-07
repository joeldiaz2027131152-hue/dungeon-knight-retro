using DungeonKnight.Player;
using UnityEngine;

namespace DungeonKnight.Visuals
{
    [RequireComponent(typeof(Rigidbody2D), typeof(SpriteRenderer))]
    public class SquashStretchAnimator : MonoBehaviour
    {
        [SerializeField] private float runBobStrength = 0.035f;
        [SerializeField] private float runBobSpeed = 11f;
        [SerializeField] private float attackStretch = 0.06f;

        private Rigidbody2D body;
        private PlayerController2D player;
        private Vector3 baseScale;
        private float phase;

        private void Awake()
        {
            body = GetComponent<Rigidbody2D>();
            player = GetComponent<PlayerController2D>();
            baseScale = transform.localScale;
            phase = Random.Range(0f, 10f);
        }

        private void LateUpdate()
        {
            float speed = Mathf.Abs(body.linearVelocity.x);
            bool grounded = player ? player.IsGrounded : Mathf.Abs(body.linearVelocity.y) < 0.05f;
            bool attacking = player && player.IsAttacking;
            float bob = grounded && speed > 0.15f ? Mathf.Sin((Time.time + phase) * runBobSpeed) * runBobStrength : 0f;
            float squashX = 1f + Mathf.Abs(bob) * 0.35f;
            float squashY = 1f - Mathf.Abs(bob) * 0.25f;

            if (!grounded)
            {
                squashX = 0.97f;
                squashY = 1.04f;
            }

            if (attacking)
            {
                squashX += attackStretch;
                squashY -= attackStretch * 0.35f;
            }

            transform.localScale = new Vector3(baseScale.x * squashX, baseScale.y * squashY, baseScale.z);
        }
    }
}
