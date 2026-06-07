using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class LoreTablet : MonoBehaviour, IInteractable
    {
        [TextArea(3, 10)]
        [SerializeField] private string message;

        public string Prompt => "Leer carta";

        public void SetMessage(string text)
        {
            message = text;
        }

        public void Interact(GameObject player)
        {
            InteractionFeedback.Show(message, 5f);
            Debug.Log(message);
        }
    }
}
