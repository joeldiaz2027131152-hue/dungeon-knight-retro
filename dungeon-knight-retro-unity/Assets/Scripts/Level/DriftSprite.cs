using UnityEngine;

namespace DungeonKnight.Level
{
    public class DriftSprite : MonoBehaviour
    {
        [SerializeField] private Vector2 amplitude = new Vector2(0.2f, 0.04f);
        [SerializeField] private float speed = 0.35f;

        private Vector3 origin;
        private float phase;

        public void Configure(Vector2 driftAmplitude, float driftSpeed)
        {
            amplitude = driftAmplitude;
            speed = driftSpeed;
        }

        private void Awake()
        {
            origin = transform.position;
            phase = Random.Range(0f, 10f);
        }

        private void Update()
        {
            float t = Time.time * speed + phase;
            transform.position = origin + new Vector3(Mathf.Sin(t) * amplitude.x, Mathf.Cos(t * 1.3f) * amplitude.y, 0f);
        }
    }
}
