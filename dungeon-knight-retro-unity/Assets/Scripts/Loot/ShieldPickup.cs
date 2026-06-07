using DungeonKnight.Interactables;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Loot
{
    public class ShieldPickup : MonoBehaviour, IInteractable
    {
        public string Prompt => "Recoger escudo";

        public void Interact(GameObject player)
        {
            if (!player.TryGetComponent(out PlayerInventory inventory)) return;

            if (inventory.HasTowerShield)
            {
                InteractionFeedback.Show("Ya tienes el escudo de la torre.");
                return;
            }

            inventory.AddTowerShield();
            RetroAudio.Play("checkpoint");
            HitBurst.Spawn(transform.position + Vector3.up * 0.2f, new Color(1f, 0.82f, 0.24f), 18);
            InteractionFeedback.Show("Escudo de la Torre guardado. Puedes cambiarlo en Inventario > Escudos.", 3.4f);
            Destroy(gameObject);
        }
    }
}
