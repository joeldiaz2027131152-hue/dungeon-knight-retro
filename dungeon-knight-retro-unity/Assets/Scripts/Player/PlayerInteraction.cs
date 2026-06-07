using DungeonKnight.Interactables;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Player
{
    public class PlayerInteraction : MonoBehaviour
    {
        [SerializeField] private LayerMask interactableMask;

        private IInteractable currentInteractable;
        private Transform currentTarget;
        private GUIStyle promptStyle;
        private GUIStyle keyStyle;

        private void Awake()
        {
            if (interactableMask == 0) interactableMask = LayerMask.GetMask("Interactable");
            if (interactableMask == 0) interactableMask = ~0;
        }

        private void Update()
        {
            currentInteractable = FindClosestInteractable(out currentTarget);
            if (!Input.GetKeyDown(KeyCode.E)) return;

            if (currentInteractable != null)
            {
                currentInteractable.Interact(gameObject);
                return;
            }

            InteractionFeedback.Show("No hay nada cerca para usar.");
        }

        private void OnGUI()
        {
            if (currentInteractable == null || !currentTarget || !Camera.main) return;

            Vector3 screen = Camera.main.WorldToScreenPoint(currentTarget.position + Vector3.up * 1.05f);
            if (screen.z < 0f) return;

            promptStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = 15,
                alignment = TextAnchor.MiddleCenter,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.94f, 0.9f, 0.78f) }
            };
            keyStyle ??= new GUIStyle(promptStyle)
            {
                fontSize = 16,
                normal = { textColor = new Color(1f, 0.82f, 0.3f) }
            };

            string prompt = currentInteractable.Prompt;
            float width = Mathf.Clamp(98f + prompt.Length * 7f, 150f, 260f);
            Rect rect = new Rect(screen.x - width * 0.5f, Screen.height - screen.y - 36f, width, 30f);
            DrawBox(rect, new Color(0.035f, 0.035f, 0.052f, 0.88f), new Color(0.68f, 0.52f, 0.27f, 0.78f));
            GUI.Label(new Rect(rect.x + 8, rect.y + 3, 34, rect.height), "E", keyStyle);
            GUI.Label(new Rect(rect.x + 38, rect.y + 3, rect.width - 46, rect.height), prompt, promptStyle);
        }

        private IInteractable FindClosestInteractable(out Transform target)
        {
            Collider2D[] hits = Physics2D.OverlapCircleAll(transform.position, GameConstants.InteractRadius, interactableMask);
            IInteractable closest = null;
            target = null;
            float closestDistance = float.MaxValue;

            foreach (Collider2D hit in hits)
            {
                if (!hit.TryGetComponent(out IInteractable interactable)) continue;

                float distance = Vector2.Distance(transform.position, hit.transform.position);
                if (distance >= closestDistance) continue;

                closest = interactable;
                target = hit.transform;
                closestDistance = distance;
            }

            return closest;
        }

        private static void DrawBox(Rect rect, Color fill, Color border)
        {
            Color previous = GUI.color;
            GUI.color = fill;
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = border;
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width, 1.5f), Texture2D.whiteTexture);
            GUI.DrawTexture(new Rect(rect.x, rect.yMax - 1.5f, rect.width, 1.5f), Texture2D.whiteTexture);
            GUI.DrawTexture(new Rect(rect.x, rect.y, 1.5f, rect.height), Texture2D.whiteTexture);
            GUI.DrawTexture(new Rect(rect.xMax - 1.5f, rect.y, 1.5f, rect.height), Texture2D.whiteTexture);
            GUI.color = previous;
        }
    }
}
