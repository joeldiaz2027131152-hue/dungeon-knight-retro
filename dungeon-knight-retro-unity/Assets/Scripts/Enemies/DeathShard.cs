using UnityEngine;

namespace DungeonKnight.Enemies
{
    public class DeathShard : MonoBehaviour
    {
        private SpriteRenderer spriteRenderer;
        private float life = 0.9f;
        private float maxLife = 0.9f;

        public void Configure(float seconds)
        {
            life = Mathf.Max(0.1f, seconds);
            maxLife = life;
        }

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
        }

        private void Update()
        {
            life -= Time.deltaTime;
            if (spriteRenderer)
            {
                Color color = spriteRenderer.color;
                color.a = Mathf.Clamp01(life / maxLife);
                spriteRenderer.color = color;
            }

            if (life <= 0f)
            {
                Destroy(gameObject);
            }
        }
    }
}
