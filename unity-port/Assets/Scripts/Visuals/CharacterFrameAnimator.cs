using DungeonKnight.Enemies;
using DungeonKnight.Player;
using UnityEngine;

namespace DungeonKnight.Visuals
{
    [RequireComponent(typeof(SpriteRenderer), typeof(Rigidbody2D))]
    public class CharacterFrameAnimator : MonoBehaviour
    {
        public enum VisualKind
        {
            Knight,
            Guard,
            Archer
        }

        [SerializeField] private VisualKind kind;

        private SpriteRenderer spriteRenderer;
        private Rigidbody2D body;
        private PlayerController2D player;
        private SkeletonMinionAI guard;
        private SkeletonArcherAI archer;
        private float frameTimer;
        private int frame;

        public void Configure(VisualKind visualKind)
        {
            kind = visualKind;
        }

        private void Awake()
        {
            spriteRenderer = GetComponent<SpriteRenderer>();
            body = GetComponent<Rigidbody2D>();
            player = GetComponent<PlayerController2D>();
            guard = GetComponent<SkeletonMinionAI>();
            archer = GetComponent<SkeletonArcherAI>();
        }

        private void Update()
        {
            frameTimer += Time.deltaTime;
            float frameDuration = player && player.IsRolling ? 0.07f : 0.16f;
            if (frameTimer >= frameDuration)
            {
                frameTimer = 0f;
                frame = (frame + 1) % 4;
            }

            spriteRenderer.sprite = kind switch
            {
                VisualKind.Knight => KnightFrame(),
                VisualKind.Archer => ArcherFrame(),
                _ => GuardFrame()
            };
        }

        private Sprite KnightFrame()
        {
            if (player && player.IsRolling) return frame % 2 == 0 ? CharacterSpriteFactory.KnightRollA() : CharacterSpriteFactory.KnightRollB();
            if (player && player.IsBlocking) return CharacterSpriteFactory.KnightBlock();
            if (player && player.IsCharging) return CharacterSpriteFactory.KnightCharge();
            if (player && player.IsAttacking) return CharacterSpriteFactory.KnightAttack();
            if (player && !player.IsGrounded) return CharacterSpriteFactory.KnightJump();
            if (Mathf.Abs(body.linearVelocity.x) > 0.15f) return frame % 2 == 0 ? CharacterSpriteFactory.KnightRunA() : CharacterSpriteFactory.KnightRunB();
            return frame % 4 < 2 ? CharacterSpriteFactory.KnightIdleA() : CharacterSpriteFactory.KnightIdleB();
        }

        private Sprite GuardFrame()
        {
            if (guard && guard.IsAttacking) return CharacterSpriteFactory.GuardAttack();
            if (Mathf.Abs(body.linearVelocity.x) > 0.15f) return frame % 2 == 0 ? CharacterSpriteFactory.GuardRunA() : CharacterSpriteFactory.GuardRunB();
            return frame % 4 < 2 ? CharacterSpriteFactory.GuardIdleA() : CharacterSpriteFactory.GuardIdleB();
        }

        private Sprite ArcherFrame()
        {
            if (archer && archer.IsAiming) return CharacterSpriteFactory.ArcherAim();
            return frame % 4 < 2 ? CharacterSpriteFactory.ArcherIdleA() : CharacterSpriteFactory.ArcherIdleB();
        }
    }
}
