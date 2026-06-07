using UnityEngine;

namespace DungeonKnight
{
    public static class GameConstants
    {
        public const int StartingHealth = 100;
        public const int StartingStamina = 100;
        public const int SwordDamage = 30;
        public const int RollStaminaCost = 18;
        public const int ShieldBlockStaminaCost = 5;
        public const float InteractRadius = 1.8f;

        public static readonly LayerMask EnemyMask = LayerMask.GetMask("Enemy");
        public static readonly LayerMask InteractableMask = LayerMask.GetMask("Interactable");
    }
}
