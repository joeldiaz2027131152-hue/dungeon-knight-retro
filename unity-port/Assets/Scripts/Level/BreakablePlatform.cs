using System.Collections;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class BreakablePlatform : MonoBehaviour
    {
        [SerializeField] private float crumbleDelay = 0.55f;
        [SerializeField] private float respawnDelay = 3.5f;

        private Collider2D platformCollider;
        private SpriteRenderer[] renderers;
        private Vector3 startScale;
        private bool crumbling;

        private void Awake()
        {
            platformCollider = GetComponent<Collider2D>();
            renderers = GetComponentsInChildren<SpriteRenderer>();
            startScale = transform.localScale;
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (crumbling || !collision.collider.CompareTag("Player")) return;
            StartCoroutine(Crumble());
        }

        private IEnumerator Crumble()
        {
            crumbling = true;
            RetroAudio.Play("locked");
            HitBurst.Spawn(transform.position + Vector3.up * 0.2f, new Color(0.65f, 0.6f, 0.5f), 8);

            float elapsed = 0f;
            while (elapsed < crumbleDelay)
            {
                elapsed += Time.deltaTime;
                float shake = Mathf.Sin(Time.time * 42f) * 0.035f;
                transform.localScale = startScale + new Vector3(shake, -Mathf.Abs(shake), 0f);
                yield return null;
            }

            if (platformCollider) platformCollider.enabled = false;
            SetVisible(false);
            transform.localScale = startScale;
            HitBurst.Spawn(transform.position, new Color(0.48f, 0.43f, 0.34f), 14);

            yield return new WaitForSeconds(respawnDelay);

            SetVisible(true);
            if (platformCollider) platformCollider.enabled = true;
            crumbling = false;
        }

        private void SetVisible(bool visible)
        {
            foreach (SpriteRenderer renderer in renderers)
            {
                if (renderer) renderer.enabled = visible;
            }
        }
    }
}
