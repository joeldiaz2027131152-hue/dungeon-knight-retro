using UnityEngine;

namespace DungeonKnight.UI
{
    public class InteractionFeedback : MonoBehaviour
    {
        private static InteractionFeedback instance;

        private string message;
        private float visibleUntil;
        private GUIStyle messageStyle;
        private GUIStyle hintStyle;

        public static void Show(string text, float seconds = 2.5f)
        {
            if (!instance)
            {
                instance = new GameObject("Interaction Feedback").AddComponent<InteractionFeedback>();
                DontDestroyOnLoad(instance.gameObject);
            }

            instance.message = text;
            instance.visibleUntil = Time.time + seconds;
        }

        private void OnGUI()
        {
            if (string.IsNullOrWhiteSpace(message) || Time.time > visibleUntil) return;

            messageStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = 21,
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.94f, 0.89f, 0.78f) }
            };
            hintStyle ??= new GUIStyle(messageStyle)
            {
                fontSize = 13,
                fontStyle = FontStyle.Normal,
                normal = { textColor = new Color(0.75f, 0.8f, 0.86f, 0.78f) }
            };

            float width = Mathf.Min(680f, Screen.width - 48f);
            float textWidth = width - 64f;
            int fontSize = 21;
            messageStyle.fontSize = fontSize;
            float textHeight = messageStyle.CalcHeight(new GUIContent(message), textWidth);
            float maxHeight = Mathf.Max(120f, Screen.height - 96f);

            while (textHeight + 54f > maxHeight && fontSize > 13)
            {
                fontSize--;
                messageStyle.fontSize = fontSize;
                textHeight = messageStyle.CalcHeight(new GUIContent(message), textWidth);
            }

            float height = Mathf.Min(maxHeight, Mathf.Max(96f, textHeight + 48f));
            Rect rect = new Rect((Screen.width - width) * 0.5f, 28f, width, height);
            DrawPanel(rect);
            GUI.Label(new Rect(rect.x + 32f, rect.y + 22f, textWidth, rect.height - 44f), message, messageStyle);
        }

        private static void DrawPanel(Rect rect)
        {
            DrawRect(rect, new Color(0.035f, 0.035f, 0.052f, 0.94f));
            DrawRect(new Rect(rect.x, rect.y, rect.width, 2f), new Color(0.68f, 0.52f, 0.27f, 0.9f));
            DrawRect(new Rect(rect.x, rect.yMax - 2f, rect.width, 2f), new Color(0.34f, 0.25f, 0.14f, 0.9f));
            DrawRect(new Rect(rect.x, rect.y, 2f, rect.height), new Color(0.68f, 0.52f, 0.27f, 0.9f));
            DrawRect(new Rect(rect.xMax - 2f, rect.y, 2f, rect.height), new Color(0.34f, 0.25f, 0.14f, 0.9f));
            DrawRect(new Rect(rect.x + 12, rect.y + 10, rect.width - 24, 1f), new Color(1f, 0.78f, 0.34f, 0.28f));
            DrawRect(new Rect(rect.x + 12, rect.yMax - 10, rect.width - 24, 1f), new Color(1f, 0.78f, 0.34f, 0.18f));
        }

        private static void DrawRect(Rect rect, Color color)
        {
            Color previous = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = previous;
        }
    }
}
