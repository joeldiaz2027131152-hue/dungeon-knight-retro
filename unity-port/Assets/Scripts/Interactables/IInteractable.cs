using UnityEngine;

namespace DungeonKnight.Interactables
{
    public interface IInteractable
    {
        string Prompt { get; }
        void Interact(GameObject player);
    }
}
