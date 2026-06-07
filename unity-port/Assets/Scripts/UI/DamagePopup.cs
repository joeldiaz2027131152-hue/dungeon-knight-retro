using UnityEngine;

namespace DungeonKnight.UI
{
    public class DamagePopup : MonoBehaviour
    {
        private TextMesh textMesh;
        private Vector3 velocity;
        private float life;

        public static void Spawn(Vector3 position, int amount, Color color)
        {
            GameObject go = new GameObject("Damage Popup");
            go.transform.position = position;

            DamagePopup popup = go.AddComponent<DamagePopup>();
            popup.textMesh = go.AddComponent<TextMesh>();
            popup.textMesh.text = amount.ToString();
            popup.textMesh.fontSize = 42;
            popup.textMesh.anchor = TextAnchor.MiddleCenter;
            popup.textMesh.alignment = TextAlignment.Center;
            popup.textMesh.color = color;
            popup.textMesh.characterSize = 0.08f;
            popup.textMesh.GetComponent<MeshRenderer>().sortingOrder = 20;
            popup.velocity = new Vector3(Random.Range(-0.35f, 0.35f), 1.25f, 0f);
            popup.life = 0.75f;
        }

        private void Update()
        {
            life -= Time.deltaTime;
            transform.position += velocity * Time.deltaTime;
            velocity.y -= 1.2f * Time.deltaTime;

            Color color = textMesh.color;
            color.a = Mathf.Clamp01(life / 0.75f);
            textMesh.color = color;

            if (life <= 0f)
            {
                Destroy(gameObject);
            }
        }
    }
}
