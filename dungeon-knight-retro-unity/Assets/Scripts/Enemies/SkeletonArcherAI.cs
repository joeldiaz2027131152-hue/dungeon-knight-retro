using DungeonKnight.Combat;
using UnityEngine;

namespace DungeonKnight.Enemies
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Health))]
    public class SkeletonArcherAI : MonoBehaviour
    {
        [SerializeField] private float sightRange = 9f;
        [SerializeField] private float verticalSightRange = 5.5f;
        [SerializeField] private float shootCooldown = 2.1f;
        [SerializeField] private float aimWindup = 0.42f;
        [SerializeField] private float retreatRange = 2.2f;
        [SerializeField] private float retreatSpeed = 1.35f;
        [SerializeField] private int arrowDamage = 8;

        private Rigidbody2D body;
        private SpriteRenderer spriteRenderer;
        private Transform player;
        private float homeX;
        private float shootTimer;
        private float aimTimer;
        private Vector2 pendingDirection;

        public bool IsAiming => aimTimer > 0f;

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            GetComponent<Health>().SetMaxHealth(30);
            body = GetComponent<Rigidbody2D>();
            if (body)
            {
                body.constraints = RigidbodyConstraints2D.FreezeRotation;
            }
        }

        private void Start()
        {
            GameObject playerObject = GameObject.FindGameObjectWithTag("Player");
            if (playerObject) player = playerObject.transform;
            homeX = transform.position.x;
            shootTimer = Random.Range(0.4f, 1.1f);
        }

        private void FixedUpdate()
        {
            if (!player) return;

            float dx = player.position.x - transform.position.x;
            float dy = Mathf.Abs(player.position.y - transform.position.y);
            if (spriteRenderer) spriteRenderer.flipX = dx < 0f;
            if (aimTimer > 0f)
            {
                if (body) body.linearVelocity = new Vector2(0f, body.linearVelocity.y);
                aimTimer -= Time.fixedDeltaTime;
                if (spriteRenderer)
                {
                    spriteRenderer.color = Color.Lerp(Color.white, new Color(1f, 0.78f, 0.35f), Mathf.PingPong(Time.time * 9f, 1f));
                }

                if (aimTimer <= 0f)
                {
                    Shoot(pendingDirection);
                    shootTimer = shootCooldown;
                }
                return;
            }

            if (spriteRenderer) spriteRenderer.color = Color.white;
            if (Mathf.Abs(dx) > sightRange || dy > verticalSightRange)
            {
                if (body) body.linearVelocity = new Vector2(0f, body.linearVelocity.y);
                return;
            }

            UpdateRetreat(dx, dy);

            shootTimer -= Time.fixedDeltaTime;
            if (shootTimer > 0f) return;

            Vector2 target = player.position + Vector3.up * 0.35f;
            pendingDirection = (target - (Vector2)transform.position).normalized;
            aimTimer = aimWindup;
            RetroAudio.Play("charge");
        }

        private void UpdateRetreat(float dx, float dy)
        {
            if (!body) return;

            float minX = homeX - 0.12f;
            float maxX = homeX + 1.35f;
            if (Mathf.Abs(dx) > retreatRange || dy > 1.8f)
            {
                body.linearVelocity = new Vector2(0f, body.linearVelocity.y);
                return;
            }

            float away = dx >= 0f ? -1f : 1f;
            float nextX = transform.position.x + away * retreatSpeed * Time.fixedDeltaTime;
            if (nextX < minX || nextX > maxX)
            {
                body.linearVelocity = new Vector2(0f, body.linearVelocity.y);
                return;
            }

            body.linearVelocity = new Vector2(away * retreatSpeed, body.linearVelocity.y);
        }

        private void Shoot(Vector2 direction)
        {
            RetroAudio.Play("arrow");
            float side = direction.x >= 0f ? 1f : -1f;
            Vector3 start = transform.position + new Vector3(side * 0.48f, 0.35f, 0f);
            GameObject arrow = new GameObject("Archer Arrow");
            arrow.transform.position = start;
            arrow.transform.localScale = new Vector2(0.56f, 0.08f);

            SpriteRenderer renderer = arrow.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = new Color(0.72f, 0.62f, 0.42f);
            renderer.sortingOrder = 10;

            BoxCollider2D collider = arrow.AddComponent<BoxCollider2D>();
            collider.isTrigger = true;
            collider.size = Vector2.one;

            Rigidbody2D body = arrow.AddComponent<Rigidbody2D>();
            body.gravityScale = 0f;
            body.freezeRotation = true;

            arrow.AddComponent<ArrowProjectile>().Configure(direction, arrowDamage);
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
