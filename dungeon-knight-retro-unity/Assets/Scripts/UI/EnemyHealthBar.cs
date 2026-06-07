using DungeonKnight.Combat;
using UnityEngine;

namespace DungeonKnight.UI
{
    [RequireComponent(typeof(Health))]
    public class EnemyHealthBar : MonoBehaviour
    {
        private Health health;
        private GUIStyle frameStyle;

        private void Awake()
        {
            health = GetComponent<Health>();
        }

        private void OnGUI()
        {
            if (!health || health.IsDead || !Camera.main) return;

            Vector3 screen = Camera.main.WorldToScreenPoint(transform.position + Vector3.up * 0.9f);
            if (screen.z <= 0f) return;

            float width = 58f;
            float height = 7f;
            Rect rect = new Rect(screen.x - width * 0.5f, Screen.height - screen.y, width, height);

            frameStyle ??= new GUIStyle(GUI.skin.box)
            {
                margin = new RectOffset(0, 0, 0, 0),
                padding = new RectOffset(0, 0, 0, 0)
            };

            GUI.color = new Color(0.05f, 0.03f, 0.04f, 0.9f);
            GUI.Box(new Rect(rect.x - 1f, rect.y - 1f, rect.width + 2f, rect.height + 2f), string.Empty, frameStyle);
            GUI.color = new Color(0.85f, 0.08f, 0.08f, 0.95f);
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width * (health.CurrentHealth / (float)health.MaxHealth), rect.height), Texture2D.whiteTexture);
            GUI.color = Color.white;
        }
    }
}
