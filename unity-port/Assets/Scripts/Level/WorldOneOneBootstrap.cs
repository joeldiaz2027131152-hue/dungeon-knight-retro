using DungeonKnight.Combat;
using DungeonKnight.Enemies;
using DungeonKnight.Interactables;
using DungeonKnight.Loot;
using DungeonKnight.Player;
using DungeonKnight.UI;
using DungeonKnight.Visuals;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class WorldOneOneBootstrap : MonoBehaviour
    {
        private static Sprite whitePixel;
        private static bool worldOneTwoBuilt;
        private static bool worldOneThreeBuilt;
        public const float WorldOneTwoOffset = 92f;
        public const float WorldOneThreeOffset = 216f;
        public static readonly Vector3 WorldOneTwoSpawn = new Vector3(WorldOneTwoOffset + 2.2f, 0.2f, 0f);
        public static readonly Vector3 WorldOneThreeSpawn = new Vector3(WorldOneThreeOffset + 2.2f, 0.2f, 0f);
        public static readonly Vector3 WorldOneOneReturnSpawn = new Vector3(38.55f, 0.2f, 0f);

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void BuildOnPlay()
        {
            if (Object.FindAnyObjectByType<WorldOneOneBootstrap>()) return;
            new GameObject("World 1-1 Bootstrap").AddComponent<WorldOneOneBootstrap>().Build();
        }

        private void Build()
        {
            EnsureLayers();
            CreateBackdrop();

            GameObject player = CreateActor("Knight", new Vector2(0, 2.5f), new Vector2(0.95f, 1.45f), Color.white, "Player", CharacterSpriteFactory.KnightIdleA());
            SetLayerIfExists(player, "Player");
            player.AddComponent<PlayerInventory>();
            player.AddComponent<PlayerController2D>();
            player.AddComponent<PlayerInteraction>();
            player.AddComponent<CharacterFrameAnimator>().Configure(CharacterFrameAnimator.VisualKind.Knight);
            new GameObject("Game Session").AddComponent<GameSession>().BindPlayer(player, new Vector3(1.6f, 0.2f, 0f));
            CreateCamera(player.transform);
            CreateHud(player);

            CreatePlatform("Ground", new Vector2(20.85f, -1), new Vector2(43f, 1), new Color(0.22f, 0.2f, 0.28f));
            CreateGroundSurfaceDetails(new Vector2(20.85f, -1), new Vector2(43f, 1));
            CreateChamberWall(new Vector2(-1.45f, 2.05f), 7.1f, "World 1-1 Start Wall");
            CreateChamberWall(new Vector2(42.65f, 2.05f), 7.1f, "World 1-1 End Wall");
            CreatePlatform("Secret Platform A", new Vector2(16.83f, 1.85f), new Vector2(3f, 0.45f), new Color(0.28f, 0.25f, 0.34f));
            CreatePlatform("Secret Platform B", new Vector2(30.67f, 1.9f), new Vector2(3f, 0.45f), new Color(0.28f, 0.25f, 0.34f));
            CreateFloatingPlatformDetails(new Vector2(16.83f, 1.85f), 3f);
            CreateFloatingPlatformDetails(new Vector2(30.67f, 1.9f), 3f);
            CreatePlatformTrim(new Vector2(20.85f, -0.43f), 43f);
            CreateGothicWindow(new Vector2(3.6f, 2.55f), 1.35f, 3.1f, new Color(0.5f, 0.85f, 0.92f, 0.58f));
            CreateGothicWindow(new Vector2(10.8f, 2.9f), 1.45f, 3.3f, new Color(0.65f, 0.65f, 1f, 0.54f));
            CreateGothicWindow(new Vector2(18.4f, 3.1f), 1.55f, 3.55f, new Color(0.55f, 0.92f, 0.88f, 0.48f));
            CreateGothicWindow(new Vector2(27.6f, 3.5f), 1.35f, 3.05f, new Color(0.46f, 0.74f, 1f, 0.48f));
            CreateGothicWindow(new Vector2(35.7f, 4.15f), 1.5f, 3.2f, new Color(0.58f, 0.94f, 1f, 0.44f));
            CreateColumn(new Vector2(1.1f, 1.9f), 5.5f);
            CreateColumn(new Vector2(6.6f, 2.35f), 4.6f);
            CreateColumn(new Vector2(13.9f, 2.65f), 5.2f);
            CreateColumn(new Vector2(22.1f, 2.5f), 4.9f);
            CreateColumn(new Vector2(31.8f, 2.8f), 5.6f);
            CreateColumn(new Vector2(40.4f, 2.2f), 5.3f);
            CreateCeilingBlade(new Vector2(10f, 4.85f), 2.75f, 0f);
            CreateCeilingBlade(new Vector2(20.83f, 4.95f), 2.95f, 1.4f);
            CreateCeilingBlade(new Vector2(27.5f, 4.85f), 2.75f, 2.7f);
            CreateIronFence(new Vector2(4.2f, -0.28f), 4.6f);
            CreateIronFence(new Vector2(24.7f, -0.28f), 5.6f);
            CreateDecorativeBox("Broken Arch", new Vector2(5.6f, 0.6f), new Vector2(0.35f, 2.3f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateDecorativeBox("Broken Arch Top", new Vector2(6.55f, 1.65f), new Vector2(1.9f, 0.28f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateDecorativeBox("Mid Ruin Pillar", new Vector2(17.2f, 0.45f), new Vector2(0.4f, 2.1f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateDecorativeBox("Mid Ruin Top", new Vector2(18.35f, 1.5f), new Vector2(2.1f, 0.3f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateDecorativeBox("Gate Pillar Left", new Vector2(37.1f, 0.55f), new Vector2(0.5f, 2.7f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateDecorativeBox("Gate Pillar Right", new Vector2(39.6f, 0.55f), new Vector2(0.5f, 2.7f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateDecorativeBox("Gate Arch Top", new Vector2(38.35f, 1.95f), new Vector2(3.1f, 0.35f), new Color(0.15f, 0.13f, 0.18f), 0);
            CreateBanner(new Vector2(12.6f, 1.7f), new Color(0.45f, 0.06f, 0.09f));
            CreateBanner(new Vector2(26.6f, 1.45f), new Color(0.12f, 0.22f, 0.45f));
            CreateBanner(new Vector2(34.2f, 1.9f), new Color(0.38f, 0.28f, 0.08f));
            CreateChain(new Vector2(14.6f, 2.1f), 1.6f);
            CreateChain(new Vector2(24.8f, 1.75f), 1.25f);
            CreateChain(new Vector2(33.2f, 2.55f), 1.55f);
            CreateChainArc(new Vector2(2.2f, 1.1f), new Vector2(8.8f, 0.2f), 10);
            CreateChainArc(new Vector2(25.2f, 1.2f), new Vector2(31.5f, 1.7f), 9);
            CreateMist(new Vector2(8f, -0.36f), 6.5f);
            CreateMist(new Vector2(22f, -0.3f), 7.2f);
            CreateMist(new Vector2(35.5f, -0.26f), 6.8f);
            CreateAmbientDust();
            CreateBrokenStatue(new Vector2(2.4f, -0.08f));
            CreateFloorBrazier(new Vector2(4.7f, 0.18f));
            CreateWallTorch(new Vector2(6.9f, 1.05f), false);
            CreateWallTorch(new Vector2(14.3f, 4.18f), true);
            CreateFloorBrazier(new Vector2(22.4f, 0.18f));
            CreateWallTorch(new Vector2(30.2f, 2.68f), false);
            CreateWallTorch(new Vector2(37.1f, 1.75f), true);
            CreateWallTorch(new Vector2(39.6f, 1.75f), false);
            CreateSpikes(new Vector2(8f, -0.43f), 10, 0.72f);
            CreateSpikes(new Vector2(15.5f, -0.43f), 10, 1.05f);
            CreateSpikes(new Vector2(23.67f, -0.43f), 10, 0.72f);
            CreateSpikes(new Vector2(29.83f, -0.43f), 12, 1.35f);
            CreateDangerMarker(new Vector2(8f, 0.05f), 0.9f);
            CreateDangerMarker(new Vector2(15.5f, 0.05f), 1.15f);
            CreateDangerMarker(new Vector2(23.67f, 0.05f), 0.9f);
            CreateDangerMarker(new Vector2(29.83f, 0.05f), 1.45f);

            CreateBonfire(new Vector2(1.6f, 0.02f));
            CreateLore(new Vector2(2.9f, -0.1f), "J: ataque ligero.\nMantener J: ataque cargado.\n\nL: rodar para esquivar dano.");
            CreateLore(new Vector2(4.55f, -0.1f), "K: levantar escudo.\n\nBloquea justo a tiempo\npara hacer parry\ny aturdir al enemigo.");
            CreateLore(new Vector2(9.1f, -0.1f), "S: agacharte bajo cuchillas.\n\nLas marcas oxidadas del suelo\nsenalan donde conviene bajar la cabeza.");
            CreateLore(new Vector2(18.85f, 2.42f), "Las plataformas flotantes\nceden si saltas o bajas\nmientras estas agachado.");
            CreateLore(new Vector2(33.15f, -0.1f), "El porton no responde al acero.\nBusca al guardian que carga la llave.");
            CreateBreakableCrate(new Vector2(11.7f, 0.1f), 4);
            CreateChest(new Vector2(16.97f, 2.42f), 8);
            CreateTreasureGateAndLever(new Vector2(30.65f, 2.55f), new Vector2(12.95f, 0.55f));
            CreateCrouchCue(new Vector2(10f, -0.08f));
            CreateCrouchCue(new Vector2(20.83f, -0.08f));
            GameObject shieldTutor = CreateEnemy(new Vector2(5.9f, 0.2f), 20, 0.85f, 1.75f, 6, new Color(0.82f, 0.9f, 1f));
            shieldTutor.name = "Shield Timing Tutor";
            CreateArcher(new Vector2(15.55f, 2.8f));
            CreateEnemy(new Vector2(19.17f, 0.2f), 60, 1.85f, 3.2f, 10, new Color(1f, 0.95f, 0.86f));
            CreateEnemy(new Vector2(25f, 0.2f), 45, 1.65f, 2.8f, 8, Color.white);
            CreateKeyGuardian(new Vector2(35.1f, 0.2f));
            CreateExitDoor(new Vector2(40.2f, 0.25f));

            Debug.Log("Dungeon Knight Unity Port: World 1-1 placeholder construido.");
        }

        public static void BuildWorldOneTwo()
        {
            if (worldOneTwoBuilt) return;
            worldOneTwoBuilt = true;

            const float offset = WorldOneTwoOffset;
            CreateCastleExteriorBackdrop(new Vector2(offset + 50f, 2.75f), new Vector2(128f, 8.2f), offset + 71f);
            CreateSolidBackWall(new Vector2(offset + 48.75f, 2.65f), new Vector2(97.8f, 7.2f), "World 1-2 Back Wall");
            CreateDecorativeBox("World 1-2 Low Fog", new Vector2(offset + 50f, 0.1f), new Vector2(112f, 1.4f), new Color(0.34f, 0.45f, 0.52f, 0.2f), -2);

            CreatePlatform("World 1-2 Lower Floor", new Vector2(offset + 18f, -1f), new Vector2(38f, 1f), new Color(0.21f, 0.2f, 0.28f));
            CreateGroundSurfaceDetails(new Vector2(offset + 18f, -1f), new Vector2(38f, 1f));
            CreateChamberWall(new Vector2(offset - 1.65f, 2.38f), 7.75f, "World 1-2 Start Wall");
            CreateChamberWall(new Vector2(offset + 99.15f, 2.38f), 7.75f, "World 1-2 End Wall");
            CreatePlatform("World 1-2 Lower Floor B", new Vector2(offset + 59f, -1f), new Vector2(38f, 1f), new Color(0.21f, 0.2f, 0.28f));
            CreateGroundSurfaceDetails(new Vector2(offset + 59f, -1f), new Vector2(38f, 1f));
            CreatePlatform("World 1-2 End Floor", new Vector2(offset + 88f, -1f), new Vector2(20f, 1f), new Color(0.21f, 0.2f, 0.28f));
            CreateGroundSurfaceDetails(new Vector2(offset + 88f, -1f), new Vector2(20f, 1f));

            CreatePlatform("World 1-2 Mid Walkway A", new Vector2(offset + 24f, 1.55f), new Vector2(10f, 0.5f), new Color(0.28f, 0.25f, 0.34f));
            CreateFloatingPlatformDetails(new Vector2(offset + 24f, 1.55f), 10f);
            CreatePlatform("World 1-2 Mid Walkway B", new Vector2(offset + 42f, 1.55f), new Vector2(11f, 0.5f), new Color(0.28f, 0.25f, 0.34f));
            CreateFloatingPlatformDetails(new Vector2(offset + 42f, 1.55f), 11f);
            CreatePlatform("World 1-2 Upper Walkway A", new Vector2(offset + 57f, 3.75f), new Vector2(13f, 0.5f), new Color(0.27f, 0.25f, 0.35f));
            CreateFloatingPlatformDetails(new Vector2(offset + 57f, 3.75f), 13f);
            CreatePlatform("World 1-2 Upper Walkway B", new Vector2(offset + 77f, 3.75f), new Vector2(12f, 0.5f), new Color(0.27f, 0.25f, 0.35f));
            CreateFloatingPlatformDetails(new Vector2(offset + 77f, 3.75f), 12f);
            CreatePlatform("World 1-2 Final Balcony", new Vector2(offset + 93f, 1.65f), new Vector2(8f, 0.5f), new Color(0.28f, 0.25f, 0.34f));
            CreateFloatingPlatformDetails(new Vector2(offset + 93f, 1.65f), 8f);

            CreateStaircase("World 1-2 Stair Lower To Mid", new Vector2(offset + 13.8f, -0.5f), 13, 0.4f, 2.3f / 13f, true);
            CreateStaircase("World 1-2 Stair Mid To Upper", new Vector2(offset + 47.5f, 1.8f), 14, 3f / 14f, 2.2f / 14f, true);
            CreateStaircase("World 1-2 Stair Upper Down", new Vector2(offset + 83f, 1.9f), 13, 6f / 13f, 2.1f / 13f, false);
            CreateStairConnector("World 1-2 Lower Stair Landing", new Vector2(offset + 19f, 1.66f), 0.9f);
            CreateStairConnector("World 1-2 Mid Stair Base Landing", new Vector2(offset + 47.5f, 1.66f), 0.9f);
            CreateStairConnector("World 1-2 Mid Stair Top Landing", new Vector2(offset + 50.5f, 3.86f), 0.9f);
            CreateStairConnector("World 1-2 Upper Stair Landing", new Vector2(offset + 83f, 3.86f), 0.9f);
            CreateStairConnector("World 1-2 Final Stair Landing", new Vector2(offset + 89f, 1.76f), 0.9f);
            CreatePlatform("World 1-2 Side Treasure Ledge", new Vector2(offset + 69.3f, 5.55f), new Vector2(4.4f, 0.45f), new Color(0.28f, 0.25f, 0.34f));
            CreateFloatingPlatformDetails(new Vector2(offset + 69.3f, 5.55f), 4.4f);

            CreateReturnDoor(new Vector2(offset + 0.75f, 0.25f));
            CreateBonfire(new Vector2(offset + 4.3f, 0.02f));
            CreateLore(new Vector2(offset + 6.1f, -0.1f), "Cuando las cuatro coronas cayeron,\nel mundo aprendio a temer la oscuridad.\n\nLos lideres aun viven,\npero sus almas ya no les pertenecen.\n\nSi encuentras las hogueras,\nsigue su luz.");
            CreateLore(new Vector2(offset + 61.8f, 4.55f), "El hierro viejo aun recuerda\nlas rejas del principio.\n\nSi la palanca despierta,\nvuelve por lo que dejaste atras.");
            CreateWallTorch(new Vector2(offset + 18.5f, 1.15f), false);
            CreateWallTorch(new Vector2(offset + 32.7f, 2.65f), true);
            CreateWallTorch(new Vector2(offset + 55.8f, 5.25f), false);
            CreateWallTorch(new Vector2(offset + 76.7f, 5.2f), true);
            CreateFloorBrazier(new Vector2(offset + 90.6f, 0.18f));

            CreateGothicWindow(new Vector2(offset + 8f, 2.5f), 1.55f, 3.25f, new Color(0.48f, 0.82f, 0.94f, 0.5f));
            CreateGothicWindow(new Vector2(offset + 20f, 3.1f), 1.45f, 3.4f, new Color(0.62f, 0.68f, 1f, 0.48f));
            CreateGothicWindow(new Vector2(offset + 36f, 3.45f), 1.55f, 3.65f, new Color(0.52f, 0.9f, 0.88f, 0.48f));
            CreateGothicWindow(new Vector2(offset + 58f, 5.55f), 1.65f, 3.45f, new Color(0.46f, 0.72f, 1f, 0.45f));
            CreateGothicWindow(new Vector2(offset + 78.5f, 5.65f), 1.5f, 3.3f, new Color(0.64f, 0.86f, 1f, 0.42f));
            CreateGothicWindow(new Vector2(offset + 93f, 3.0f), 1.42f, 3.25f, new Color(0.58f, 0.94f, 1f, 0.44f));

            CreateColumn(new Vector2(offset + 10.8f, 2.2f), 5.2f);
            CreateColumn(new Vector2(offset + 29.2f, 2.65f), 5.9f);
            CreateColumn(new Vector2(offset + 51.8f, 3.8f), 6.5f);
            CreateColumn(new Vector2(offset + 70.6f, 3.7f), 6.3f);
            CreateColumn(new Vector2(offset + 96.6f, 2.2f), 5.4f);
            CreateBanner(new Vector2(offset + 23.4f, 2.92f), new Color(0.42f, 0.06f, 0.1f));
            CreateBanner(new Vector2(offset + 61.2f, 5.2f), new Color(0.13f, 0.24f, 0.48f));
            CreateChainArc(new Vector2(offset + 26f, 2.7f), new Vector2(offset + 41f, 2.75f), 16);
            CreateChainArc(new Vector2(offset + 58f, 5.0f), new Vector2(offset + 76f, 4.95f), 18);
            CreateMist(new Vector2(offset + 17f, -0.3f), 9f);
            CreateMist(new Vector2(offset + 56f, -0.28f), 10f);
            CreateMist(new Vector2(offset + 89f, -0.26f), 7f);

            CreateCeilingBlade(new Vector2(offset + 31.2f, 5.0f), 2.15f, 0.7f);
            CreateCeilingBlade(new Vector2(offset + 72.6f, 6.2f), 2.05f, 2.1f);
            CreateSpikes(new Vector2(offset + 53.9f, 4.07f), 9, 1.1f);
            CreateDangerMarker(new Vector2(offset + 53.9f, 4.55f), 1.12f);
            CreateSpikes(new Vector2(offset + 84.6f, -0.43f), 12, 1.15f);
            CreateDangerMarker(new Vector2(offset + 84.6f, 0.05f), 1.2f);
            CreateFireTrap(new Vector2(offset + 39.4f, -0.22f), 10);
            CreateFireTrap(new Vector2(offset + 75.05f, 4.28f), 10);
            CreateFireTrap(new Vector2(offset + 91.4f, -0.22f), 12);
            CreateTreasureGateAndLever(new Vector2(offset + 64.2f, 4.55f), new Vector2(offset + 8.35f, 0.55f));
            CreateBreakableCrate(new Vector2(offset + 28.6f, 2.15f), 3);
            CreateBreakableCrate(new Vector2(offset + 58.2f, 4.35f), 4);
            CreateBreakableStonePlatform(new Vector2(offset + 65.7f, 5.55f), new Vector2(1.55f, 0.45f));
            CreateBreakableStonePlatform(new Vector2(offset + 72.9f, 5.55f), new Vector2(1.65f, 0.45f));
            CreateEnemy(new Vector2(offset + 12.2f, 0.2f), 45, 1.45f, 2.7f, 8, Color.white);
            CreateEnemy(new Vector2(offset + 24.8f, 2.2f), 45, 1.25f, 2.7f, 8, Color.white);
            CreateEnemy(new Vector2(offset + 35.6f, 2.2f), 45, 1.35f, 2.75f, 8, Color.white);
            CreateChasingBat(new Vector2(offset + 43.6f, 3.25f));
            CreateChasingBat(new Vector2(offset + 70.2f, 5.45f));
            CreateArcher(new Vector2(offset + 62.4f, 4.55f));
            CreateArcher(new Vector2(offset + 74.7f, 4.55f));
            CreateMiniArena(offset);
            CreateEnemy(new Vector2(offset + 93.3f, 2.25f), 45, 1.25f, 2.7f, 8, Color.white);
            CreateExitDoorNoKey(new Vector2(offset + 96.6f, 2.25f));

            Debug.Log("Dungeon Knight Unity Port: World 1-2 base largo construido.");
        }

        public static void BuildWorldOneThree()
        {
            if (worldOneThreeBuilt) return;
            worldOneThreeBuilt = true;

            const float offset = WorldOneThreeOffset;
            const float towerLeftInnerX = -0.8f;
            const float towerRightInnerX = 58.8f;
            const float towerCenterX = (towerLeftInnerX + towerRightInnerX) * 0.5f;
            const float towerWidth = towerRightInnerX - towerLeftInnerX;
            const float bottomRoomDoorX = 18.2f;
            const float floorGap = 3.2f;
            const float bottomRoomY = -10.6f;
            const float lowerTwoY = -7.4f;
            const float lowerOneY = -4.2f;
            const float entryY = -1f;
            const float upperOneY = 2.2f;
            const float topY = 5.4f;
            const int stairSteps = 14;
            const float stairStepWidth = 0.5f;
            const float stairWidth = stairSteps * stairStepWidth;
            const float leftStairX = 1.2f;
            const float rightStairX = 56.5f;
            float ActorOnFloor(float floorY) => floorY + 1.22f;
            float CrateOnFloor(float floorY) => floorY + 0.86f;
            float ChestOnFloor(float floorY) => floorY + 1.01f;

            void CreateFullFloor(string name, float y, Color color)
            {
                Vector2 center = new Vector2(offset + towerCenterX, y);
                CreatePlatform(name, center, new Vector2(towerWidth, 1f), color);
                CreateGroundSurfaceDetails(center, new Vector2(towerWidth, 1f));
            }

            void CreateCompactStair(string name, float lowerFloorY, bool startsLeft)
            {
                float baseX = startsLeft ? leftStairX : rightStairX - stairWidth;
                float lowerTopY = lowerFloorY + 0.5f;
                float upperTopY = lowerFloorY + floorGap + 0.5f;
                CreateStaircase(name, new Vector2(offset + baseX, lowerTopY), stairSteps, stairStepWidth, floorGap / stairSteps, startsLeft);

                float lowerEndX = startsLeft ? baseX : baseX + stairWidth;
                float upperEndX = startsLeft ? baseX + stairWidth : baseX;
                CreateStairConnector(name + " Lower Connector", new Vector2(offset + lowerEndX, lowerTopY - 0.12f), 1.05f);
                CreateStairConnector(name + " Upper Connector", new Vector2(offset + upperEndX, upperTopY - 0.12f), 1.05f);
            }

            CreateCastleExteriorBackdrop(new Vector2(offset + towerCenterX, -2.35f), new Vector2(74f, 23.4f), offset + 46f);
            CreateSolidBackWall(new Vector2(offset + towerCenterX, -2.35f), new Vector2(61.4f, 21.4f), "World 1-3 Tower Back Wall");
            CreateDecorativeBox("World 1-3 Abyss Black", new Vector2(offset + towerCenterX, -12.85f), new Vector2(70f, 3.2f), new Color(0.002f, 0.002f, 0.006f, 0.96f), -4);
            CreateDecorativeBox("World 1-3 Low Fog", new Vector2(offset + towerCenterX, -10.6f), new Vector2(62f, 1.05f), new Color(0.34f, 0.45f, 0.52f, 0.18f), -2);

            CreateChamberWall(new Vector2(offset - 1.6f, -2.35f), 21.8f, "World 1-3 Entry Tower Wall");
            CreateChamberWall(new Vector2(offset + 59.6f, -2.35f), 21.8f, "World 1-3 Exit Tower Wall");

            CreateFullFloor("World 1-3 Bottom Room Floor Walkway", bottomRoomY, new Color(0.15f, 0.15f, 0.22f));
            float stairWalkwayWidth = bottomRoomDoorX - towerLeftInnerX;
            float stairWalkwayCenterX = (towerLeftInnerX + bottomRoomDoorX) * 0.5f;
            float roofWidth = towerRightInnerX - bottomRoomDoorX;
            float roofCenterX = (bottomRoomDoorX + towerRightInnerX) * 0.5f;
            CreatePlatform("World 1-3 Prison Stair Walkway", new Vector2(offset + stairWalkwayCenterX, lowerTwoY), new Vector2(stairWalkwayWidth, 1f), new Color(0.17f, 0.17f, 0.24f));
            CreateGroundSurfaceDetails(new Vector2(offset + stairWalkwayCenterX, lowerTwoY), new Vector2(stairWalkwayWidth, 1f));
            CreatePlatform("World 1-3 Bottom Room Roof", new Vector2(offset + roofCenterX, lowerTwoY), new Vector2(roofWidth, 1f), new Color(0.17f, 0.17f, 0.24f));
            CreateGroundSurfaceDetails(new Vector2(offset + roofCenterX, lowerTwoY), new Vector2(roofWidth, 1f));
            CreateFullFloor("World 1-3 Lower Floor Walkway", lowerOneY, new Color(0.19f, 0.18f, 0.26f));
            CreateFullFloor("World 1-3 Entry Floor Walkway", entryY, new Color(0.21f, 0.2f, 0.28f));
            CreateFullFloor("World 1-3 Upper Tower Walkway", upperOneY, new Color(0.27f, 0.25f, 0.34f));
            CreateFullFloor("World 1-3 Spire Exit Walkway", topY, new Color(0.3f, 0.27f, 0.36f));

            CreateDecorativeBox("World 1-3 Bottom Room Ceiling", new Vector2(offset + 37f, -7.95f), new Vector2(34f, 0.7f), new Color(0.12f, 0.115f, 0.17f), 1);
            CreatePlatformTrim(new Vector2(offset + 37f, -7.56f), 34f);
            CreateDoorFrame(new Vector2(offset + 18.35f, bottomRoomY + 1.5f));
            CreateChamberWall(new Vector2(offset + 55.4f, -9.05f), 4.1f, "World 1-3 Bottom Room Right Wall");

            CreateCompactStair("World 1-3 Bottom Left Stair", bottomRoomY, true);
            CreateCompactStair("World 1-3 Lower Right Stair", lowerTwoY, false);
            CreateCompactStair("World 1-3 Lower Left Stair", lowerOneY, true);
            CreateCompactStair("World 1-3 Entry Right Stair", entryY, false);
            CreateCompactStair("World 1-3 Upper Left Stair", upperOneY, true);

            CreateReturnDoorToWorldOneTwo(new Vector2(offset + 3.2f, entryY + 1.5f));
            CreateBonfire(new Vector2(offset + 6.4f, 0.02f));
            CreateLore(new Vector2(offset + 9.8f, -0.1f), "La torre no sube solamente.\nTambien muerde hacia abajo.\n\nMira las escaleras antes de correr.");
            CreateExitDoorNoKey(new Vector2(offset + 52.2f, topY + 1.5f));

            CreateGothicWindow(new Vector2(offset + 12f, 3.2f), 1.4f, 3.2f, new Color(0.48f, 0.82f, 0.94f, 0.44f));
            CreateGothicWindow(new Vector2(offset + 26f, -2.15f), 1.35f, 2.7f, new Color(0.42f, 0.7f, 0.9f, 0.36f));
            CreateGothicWindow(new Vector2(offset + 44f, -5.25f), 1.3f, 2.45f, new Color(0.36f, 0.62f, 0.82f, 0.32f));
            CreateGothicWindow(new Vector2(offset + 31f, -8.55f), 1.25f, 2.35f, new Color(0.34f, 0.58f, 0.78f, 0.3f));
            CreateGothicWindow(new Vector2(offset + 45f, 4.45f), 1.45f, 3.1f, new Color(0.58f, 0.94f, 1f, 0.42f));

            CreateColumn(new Vector2(offset + 14f, -0.1f), 9.8f);
            CreateColumn(new Vector2(offset + 29f, -2.1f), 10.5f);
            CreateColumn(new Vector2(offset + 44f, -4.6f), 9.8f);
            CreateBanner(new Vector2(offset + 23.5f, 2.9f), new Color(0.42f, 0.06f, 0.1f));
            CreateBanner(new Vector2(offset + 43.5f, 4.55f), new Color(0.13f, 0.24f, 0.48f));
            CreateChainArc(new Vector2(offset + 14f, 3.4f), new Vector2(offset + 36f, 4.1f), 18);
            CreateMist(new Vector2(offset + 27f, -3.45f), 8f);
            CreateMist(new Vector2(offset + 42f, -6.62f), 8f);
            CreateMist(new Vector2(offset + 37f, -9.86f), 10f);
            CreateMist(new Vector2(offset + 29f, 2.6f), 7f);

            CreateWallTorch(new Vector2(offset + 10.5f, 1.4f), false);
            CreateWallTorch(new Vector2(offset + 34.4f, -2.1f), true);
            CreateWallTorch(new Vector2(offset + 49.2f, -8.2f), false);
            CreateWallTorch(new Vector2(offset + 21.6f, 3.6f), true);
            CreateFloorBrazier(new Vector2(offset + 49.5f, topY + 1.22f));

            CreateCeilingBlade(new Vector2(offset + 33.8f, 1.65f), 2.25f, 0.4f);
            CreateCeilingBlade(new Vector2(offset + 41.8f, 4.85f), 2.15f, 1.8f);
            CreateSpikes(new Vector2(offset + 24.6f, lowerOneY + 0.57f), 10, 1.18f);
            CreateDangerMarker(new Vector2(offset + 24.6f, lowerOneY + 1.05f), 1.2f);
            CreateSpikes(new Vector2(offset + 43.2f, entryY + 0.57f), 10, 1.15f);
            CreateDangerMarker(new Vector2(offset + 43.2f, entryY + 1.05f), 1.2f);
            CreateSpikes(new Vector2(offset + 38.3f, upperOneY + 0.57f), 10, 1.15f);
            CreateDangerMarker(new Vector2(offset + 38.3f, upperOneY + 1.05f), 1.2f);
            CreateFireTrap(new Vector2(offset + 30.6f, entryY + 0.78f), 11);
            CreateFireTrap(new Vector2(offset + 45.8f, upperOneY + 0.78f), 12);

            CreateBreakableCrate(new Vector2(offset + 16.2f, CrateOnFloor(entryY)), 3);
            CreateBreakableCrate(new Vector2(offset + 42.5f, CrateOnFloor(lowerOneY)), 5);
            CreateBreakableCrate(new Vector2(offset + 22.5f, CrateOnFloor(lowerTwoY)), 4);
            CreateBreakableCrate(new Vector2(offset + 50.2f, CrateOnFloor(bottomRoomY)), 7);
            CreateBreakableCrate(new Vector2(offset + 24.8f, CrateOnFloor(upperOneY)), 4);
            CreateChest(new Vector2(offset + 34.8f, ChestOnFloor(topY)), 18);
            CreateBreakableStonePlatform(new Vector2(offset + 25.8f, upperOneY + 0.5f), new Vector2(1.6f, 0.45f));
            CreateTowerShieldAmbush(offset);

            CreateEnemy(new Vector2(offset + 14.4f, ActorOnFloor(entryY)), 45, 1.2f, 2.65f, 8, Color.white);
            CreateEnemy(new Vector2(offset + 36.2f, ActorOnFloor(lowerOneY)), 45, 1.25f, 2.7f, 8, new Color(0.86f, 0.9f, 1f));
            CreateEnemy(new Vector2(offset + 43.8f, ActorOnFloor(lowerTwoY)), 55, 1.2f, 2.8f, 9, new Color(0.9f, 0.94f, 1f));
            CreateEnemy(new Vector2(offset + 23.4f, ActorOnFloor(upperOneY)), 45, 1.25f, 2.7f, 8, Color.white);
            CreateEnemy(new Vector2(offset + 45.8f, ActorOnFloor(topY)), 65, 1.15f, 2.95f, 10, new Color(1f, 0.88f, 0.72f));
            CreateArcher(new Vector2(offset + 29.8f, ActorOnFloor(lowerOneY)));
            CreateArcher(new Vector2(offset + 47.6f, ActorOnFloor(lowerTwoY)));
            CreateArcher(new Vector2(offset + 37.5f, ActorOnFloor(topY)));
            CreateChasingBat(new Vector2(offset + 22.5f, -2.3f));
            CreateChasingBat(new Vector2(offset + 42.4f, -5.5f));
            CreateChasingBat(new Vector2(offset + 34.2f, 3.5f));

            Debug.Log("Dungeon Knight Unity Port: World 1-3 torre construida.");
        }

        private static GameObject CreateActor(string name, Vector2 position, Vector2 size, Color color, string tag, Sprite sprite)
        {
            GameObject go = CreateBox(name, position, size, color, sprite, 3);
            go.tag = tag;
            go.AddComponent<Rigidbody2D>().freezeRotation = true;
            go.AddComponent<Health>();
            return go;
        }

        private static GameObject CreateEnemy(Vector2 position, int health, float patrolSpeed, float chaseSpeed, int damage, Color tint)
        {
            GameObject enemy = CreateActor("Castle Guard", position, new Vector2(0.95f, 1.45f), tint, "Enemy", CharacterSpriteFactory.GuardIdleA());
            SetLayerIfExists(enemy, "Enemy");
            IgnorePlayerBodyCollision(enemy);
            enemy.AddComponent<SkeletonMinionAI>().Configure(health, patrolSpeed, chaseSpeed, damage);
            enemy.AddComponent<EnemyHealthBar>();
            enemy.AddComponent<CharacterFrameAnimator>().Configure(CharacterFrameAnimator.VisualKind.Guard);
            enemy.AddComponent<SkeletonDeathEffect>();
            enemy.AddComponent<CoinDropper>().Configure(Mathf.Clamp(health / 18, 2, 5));
            return enemy;
        }

        private static void CreateKeyGuardian(Vector2 position)
        {
            GameObject guardian = CreateEnemy(position, 110, 1.05f, 3.05f, 10, new Color(1f, 0.82f, 0.58f));
            guardian.name = "Gate Key Guardian";
            guardian.AddComponent<KeyDropper>();
            guardian.AddComponent<KeyGuardianVisual>();
            guardian.AddComponent<KeyGuardianBoss>();
        }

        private static void CreateArcher(Vector2 position)
        {
            GameObject archer = CreateActor("Castle Archer", position, new Vector2(0.95f, 1.45f), Color.white, "Enemy", CharacterSpriteFactory.ArcherIdleA());
            SetLayerIfExists(archer, "Enemy");
            IgnorePlayerBodyCollision(archer);
            archer.AddComponent<SkeletonArcherAI>();
            archer.AddComponent<EnemyHealthBar>();
            archer.AddComponent<CharacterFrameAnimator>().Configure(CharacterFrameAnimator.VisualKind.Archer);
            archer.AddComponent<SkeletonDeathEffect>();
            archer.AddComponent<CoinDropper>().Configure(2);
        }

        private static GameObject CreateChasingBat(Vector2 position)
        {
            GameObject bat = CreateActor("Cathedral Bat", position, new Vector2(0.95f, 0.72f), new Color(0.72f, 0.76f, 0.86f), "Enemy", PixelSpriteFactory.Bat());
            SetLayerIfExists(bat, "Enemy");
            IgnorePlayerBodyCollision(bat);
            bat.AddComponent<ChasingBatAI>().Configure(6.8f, 3.25f, 8);
            bat.AddComponent<EnemyHealthBar>();
            bat.AddComponent<SkeletonDeathEffect>();
            bat.AddComponent<CoinDropper>().Configure(2);
            return bat;
        }

        private static void CreateFireTrap(Vector2 position, int damage)
        {
            CreateDangerMarker(position + Vector2.up * 0.03f, 1.2f);
            GameObject trap = new GameObject("Timed Fire Trap");
            trap.transform.position = position;
            BoxCollider2D collider = trap.AddComponent<BoxCollider2D>();
            collider.size = new Vector2(1.05f, 1.05f);
            collider.offset = new Vector2(0f, 0.22f);
            trap.AddComponent<TimedFireTrap>().Configure(damage, 0.68f, 0.82f, 1.55f);
        }

        private static void CreateBreakableStonePlatform(Vector2 position, Vector2 size)
        {
            GameObject platform = CreateBox("Breakable Stone Platform", position, size, new Color(0.3f, 0.27f, 0.33f), PixelSpriteFactory.Stone(), 1);
            SetLayerIfExists(platform, "Ground");
            platform.AddComponent<BreakablePlatform>();
            CreateChildDecorativeBox("Breakable Platform Crack Wide", platform.transform, new Vector2(-size.x * 0.16f, 0.02f), new Vector2(size.x * 0.44f, 0.035f), new Color(0.055f, 0.05f, 0.07f, 0.86f), 3);
            CreateChildDecorativeBox("Breakable Platform Crack Down", platform.transform, new Vector2(size.x * 0.12f, -0.08f), new Vector2(0.04f, size.y * 0.54f), new Color(0.055f, 0.05f, 0.07f, 0.82f), 3);
        }

        private static void CreateMiniArena(float offset)
        {
            SimpleGate leftGate = CreateArenaGate(new Vector2(offset + 82.1f, 0.45f), "Arena Entry Gate");
            SimpleGate rightGate = CreateArenaGate(new Vector2(offset + 91.1f, 0.45f), "Arena Exit Gate");
            GameObject guardA = CreateEnemy(new Vector2(offset + 85.7f, 0.2f), 20, 1.05f, 2.65f, 7, Color.white);
            GameObject guardB = CreateEnemy(new Vector2(offset + 89.4f, 0.2f), 20, 1.05f, 2.65f, 7, new Color(0.86f, 0.9f, 1f));
            GameObject bat = CreateChasingBat(new Vector2(offset + 88.2f, 2.5f));

            GameObject trigger = new GameObject("World 1-2 Mini Arena Trigger");
            trigger.transform.position = new Vector2(offset + 87.1f, 0.85f);
            BoxCollider2D collider = trigger.AddComponent<BoxCollider2D>();
            collider.size = new Vector2(6.4f, 2.6f);
            collider.isTrigger = true;
            trigger.AddComponent<ArenaEncounter>().Configure(new[] { leftGate, rightGate }, guardA, guardB, bat);

            CreateDecorativeBox("Arena Seal Floor Rune", new Vector2(offset + 87.1f, 0.04f), new Vector2(3.6f, 0.08f), new Color(0.48f, 0.6f, 0.72f, 0.58f), 5);
            CreateDecorativeBox("Arena Seal Scratch A", new Vector2(offset + 86.45f, 0.13f), new Vector2(0.95f, 0.035f), new Color(0.76f, 0.84f, 0.92f, 0.5f), 6);
            CreateDecorativeBox("Arena Seal Scratch B", new Vector2(offset + 88.15f, 0.13f), new Vector2(0.9f, 0.035f), new Color(0.76f, 0.84f, 0.92f, 0.5f), 6);
        }

        private static void CreateTowerShieldAmbush(float offset)
        {
            SimpleGate trapGate = CreateArenaGate(new Vector2(offset + 18.35f, -8.98f), "Tower Shield Room Trap Gate");
            GameObject guardA = CreateEnemy(new Vector2(offset + 29.1f, -9.38f), 45, 1.05f, 2.65f, 8, Color.white);
            GameObject guardB = CreateEnemy(new Vector2(offset + 38.2f, -9.38f), 45, 1.05f, 2.65f, 8, new Color(0.86f, 0.9f, 1f));
            GameObject guardC = CreateEnemy(new Vector2(offset + 47.1f, -9.38f), 55, 1.08f, 2.8f, 9, new Color(1f, 0.92f, 0.78f));
            GameObject miniBoss = CreateEnemy(new Vector2(offset + 38.4f, -9.3f), 170, 0.85f, 2.7f, 13, new Color(1f, 0.76f, 0.5f));
            miniBoss.name = "Tower Shield Guardian";
            miniBoss.transform.localScale *= 1.38f;
            miniBoss.AddComponent<ShieldDropper>();

            CreateDecorativeBox("Tower Shield Room Seal", new Vector2(offset + 37.5f, -10.02f), new Vector2(10.5f, 0.08f), new Color(0.62f, 0.26f, 0.1f, 0.58f), 5);
            CreateDecorativeBox("Tower Shield Room Warning A", new Vector2(offset + 34.4f, -9.92f), new Vector2(1.6f, 0.035f), new Color(1f, 0.64f, 0.2f, 0.52f), 6);
            CreateDecorativeBox("Tower Shield Room Warning B", new Vector2(offset + 40.9f, -9.92f), new Vector2(1.6f, 0.035f), new Color(1f, 0.64f, 0.2f, 0.52f), 6);
            CreateTowerAmbushLever(new Vector2(offset + 36.8f, -9.5f), trapGate, miniBoss, guardA, guardB, guardC);
        }

        private static void CreateTowerAmbushLever(Vector2 position, SimpleGate gate, GameObject boss, params GameObject[] firstWave)
        {
            GameObject lever = new GameObject("Tower Shield Ambush Lever");
            lever.transform.position = position;
            BoxCollider2D collider = lever.AddComponent<BoxCollider2D>();
            collider.size = new Vector2(1.12f, 1.45f);
            collider.offset = new Vector2(0f, 0.05f);
            collider.isTrigger = true;
            SetLayerIfExists(lever, "Interactable");

            CreateChildDecorativeBox("Ambush Lever Stone Back", lever.transform, new Vector2(0.15f, 0f), new Vector2(0.88f, 1.18f), new Color(0.18f, 0.18f, 0.22f), 2);
            CreateChildDecorativeBox("Ambush Lever Iron Face", lever.transform, new Vector2(0.15f, -0.02f), new Vector2(0.55f, 0.82f), new Color(0.08f, 0.075f, 0.085f), 4);
            CreateChildDecorativeBox("Ambush Lever Red Rune", lever.transform, new Vector2(0.15f, 0.18f), new Vector2(0.38f, 0.04f), new Color(0.88f, 0.18f, 0.08f, 0.72f), 6);

            Transform handlePivot = new GameObject("Ambush Lever Handle Pivot").transform;
            handlePivot.SetParent(lever.transform, false);
            handlePivot.localPosition = new Vector2(-0.12f, 0.05f);
            handlePivot.localRotation = Quaternion.Euler(0f, 0f, 34f);
            CreateChildDecorativeBox("Ambush Lever Wood Handle", handlePivot, new Vector2(0f, 0.34f), new Vector2(0.16f, 0.78f), new Color(0.38f, 0.23f, 0.12f), 8);
            CreateChildDecorativeBox("Ambush Lever Metal Cap", handlePivot, new Vector2(0f, 0.75f), new Vector2(0.25f, 0.13f), new Color(0.55f, 0.52f, 0.45f), 9);
            SpriteRenderer glow = CreateChildDecorativeBox("Ambush Lever Glow", lever.transform, new Vector2(0.28f, -0.38f), new Vector2(0.09f, 0.09f), new Color(1f, 0.42f, 0.12f, 0.38f), 10).GetComponent<SpriteRenderer>();

            TowerAmbushLever ambushLever = lever.AddComponent<TowerAmbushLever>();
            ambushLever.Configure(gate, boss, handlePivot, glow, firstWave);
        }

        private static SimpleGate CreateArenaGate(Vector2 position, string name)
        {
            GameObject gate = new GameObject(name);
            gate.transform.position = position;
            BoxCollider2D collider = gate.AddComponent<BoxCollider2D>();
            collider.size = new Vector2(0.72f, 2.25f);
            SetLayerIfExists(gate, "Ground");

            CreateChildDecorativeBox("Arena Gate Left Rail", gate.transform, new Vector2(0f, 0.96f), new Vector2(0.82f, 0.11f), new Color(0.34f, 0.36f, 0.42f), 7);
            CreateChildDecorativeBox("Arena Gate Right Rail", gate.transform, new Vector2(0f, -0.96f), new Vector2(0.82f, 0.11f), new Color(0.18f, 0.19f, 0.24f), 7);
            for (int i = 0; i < 4; i++)
            {
                float x = -0.27f + i * 0.18f;
                CreateChildDecorativeBox("Arena Gate Bar", gate.transform, new Vector2(x, 0f), new Vector2(0.055f, 2.05f), new Color(0.08f, 0.085f, 0.11f), 8);
                CreateChildDecorativeBox("Arena Gate Bar Shine", gate.transform, new Vector2(x + 0.02f, 0f), new Vector2(0.015f, 1.88f), new Color(0.5f, 0.54f, 0.62f, 0.58f), 9);
            }

            return gate.AddComponent<SimpleGate>();
        }

        private static void CreateExitDoor(Vector2 position)
        {
            CreateDoorFrame(position);
            GameObject door = CreateBox("Exit Door", position, new Vector2(1.25f, 1.85f), Color.white, PixelSpriteFactory.ExitDoor(), 2);
            door.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(door, "Interactable");
            door.AddComponent<GateDoorVisual>();
            ExitDoor exitDoor = door.AddComponent<ExitDoor>();
            exitDoor.RequireGateKey();
        }

        private static void CreateExitDoorNoKey(Vector2 position)
        {
            CreateDoorFrame(position);
            GameObject door = CreateBox("Exit Door 1-2", position, new Vector2(1.25f, 1.85f), Color.white, PixelSpriteFactory.ExitDoor(), 2);
            door.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(door, "Interactable");
            door.AddComponent<ExitDoor>();
        }

        private static void CreateReturnDoor(Vector2 position)
        {
            CreateDoorFrame(position);
            GameObject door = CreateBox("Return Door 1-2", position, new Vector2(1.25f, 1.85f), Color.white, PixelSpriteFactory.ExitDoor(), 2);
            door.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(door, "Interactable");
            door.AddComponent<GateDoorVisual>();
            door.AddComponent<ExitDoor>().ReturnToWorldOneOne();
        }

        private static void CreateReturnDoorToWorldOneTwo(Vector2 position)
        {
            CreateDoorFrame(position);
            GameObject door = CreateBox("Return Door 1-3", position, new Vector2(1.25f, 1.85f), Color.white, PixelSpriteFactory.ExitDoor(), 2);
            door.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(door, "Interactable");
            door.AddComponent<GateDoorVisual>();
            door.AddComponent<ExitDoor>().ReturnToWorldOneTwo();
        }

        private static void CreateDoorFrame(Vector2 position)
        {
            CreateDecorativeBox("Exit Door Back Recess", position + Vector2.up * 0.05f, new Vector2(2.18f, 2.72f), new Color(0.035f, 0.032f, 0.048f, 0.95f), 0);
            CreateDecorativeBox("Exit Door Left Column Shadow", position + new Vector2(-0.94f, 0.02f), new Vector2(0.16f, 2.38f), new Color(0.055f, 0.05f, 0.07f), 1);
            CreateDecorativeBox("Exit Door Right Column Shadow", position + new Vector2(0.94f, 0.02f), new Vector2(0.16f, 2.38f), new Color(0.055f, 0.05f, 0.07f), 1);
            CreateDecorativeBox("Exit Door Left Column", position + new Vector2(-0.78f, 0.05f), new Vector2(0.34f, 2.35f), new Color(0.19f, 0.18f, 0.23f), 2);
            CreateDecorativeBox("Exit Door Right Column", position + new Vector2(0.78f, 0.05f), new Vector2(0.34f, 2.35f), new Color(0.19f, 0.18f, 0.23f), 2);
            CreateDecorativeBox("Exit Door Left Highlight", position + new Vector2(-0.66f, 0.05f), new Vector2(0.04f, 2.12f), new Color(0.36f, 0.35f, 0.4f, 0.65f), 3);
            CreateDecorativeBox("Exit Door Right Highlight", position + new Vector2(0.66f, 0.05f), new Vector2(0.04f, 2.12f), new Color(0.36f, 0.35f, 0.4f, 0.65f), 3);
            CreateDecorativeBox("Exit Door Arch Base", position + new Vector2(0f, 1.23f), new Vector2(2.08f, 0.24f), new Color(0.24f, 0.23f, 0.28f), 2);
            CreateDecorativeBox("Exit Door Arch Shadow", position + new Vector2(0f, 1.08f), new Vector2(1.76f, 0.08f), new Color(0.06f, 0.055f, 0.075f), 3);
            CreateDecorativeBox("Exit Door Keystone", position + new Vector2(0f, 1.48f), new Vector2(0.32f, 0.38f), new Color(0.33f, 0.31f, 0.36f), 3);
            CreateDecorativeBox("Exit Door Keystone Crack", position + new Vector2(0.04f, 1.49f), new Vector2(0.035f, 0.25f), new Color(0.08f, 0.075f, 0.1f), 4);
            CreateDecorativeBox("Exit Door Step", position + new Vector2(0f, -1.0f), new Vector2(1.95f, 0.2f), new Color(0.12f, 0.11f, 0.15f), 2);
            CreateDecorativeBox("Exit Door Step Highlight", position + new Vector2(0f, -0.9f), new Vector2(1.78f, 0.045f), new Color(0.38f, 0.37f, 0.4f, 0.5f), 3);

            for (int i = 0; i < 5; i++)
            {
                float y = position.y - 0.75f + i * 0.42f;
                CreateDecorativeBox("Exit Door Left Column Joint", position + new Vector2(-0.78f, y), new Vector2(0.32f, 0.025f), new Color(0.08f, 0.075f, 0.1f, 0.75f), 4);
                CreateDecorativeBox("Exit Door Right Column Joint", position + new Vector2(0.78f, y + 0.08f), new Vector2(0.32f, 0.025f), new Color(0.08f, 0.075f, 0.1f, 0.75f), 4);
            }
        }

        private static void CreateChamberWall(Vector2 position, float height, string name)
        {
            const float width = 1.62f;
            GameObject wall = CreateBox(name, position, new Vector2(width, height), new Color(0.12f, 0.12f, 0.17f), PixelSpriteFactory.Stone(), 2);
            SetLayerIfExists(wall, "Ground");
            CreateDecorativeBox(name + " Deep Center", position, new Vector2(width * 0.58f, height * 0.98f), new Color(0.025f, 0.026f, 0.04f, 0.9f), 3);
            CreateDecorativeBox(name + " Left Stone Edge", position + new Vector2(-width * 0.42f, 0f), new Vector2(0.22f, height), new Color(0.21f, 0.21f, 0.27f), 4);
            CreateDecorativeBox(name + " Right Stone Edge", position + new Vector2(width * 0.42f, 0f), new Vector2(0.22f, height), new Color(0.08f, 0.08f, 0.12f), 4);
            CreateDecorativeBox(name + " Left Highlight", position + new Vector2(-width * 0.49f, 0f), new Vector2(0.045f, height * 0.92f), new Color(0.46f, 0.48f, 0.54f, 0.45f), 5);
            CreateDecorativeBox(name + " Inner Right Shadow", position + new Vector2(width * 0.21f, 0f), new Vector2(0.08f, height * 0.94f), new Color(0.01f, 0.01f, 0.018f, 0.72f), 5);
            CreateDecorativeBox(name + " Top Cap", position + new Vector2(0f, height * 0.5f - 0.08f), new Vector2(width * 1.12f, 0.22f), new Color(0.3f, 0.3f, 0.36f), 6);
            CreateDecorativeBox(name + " Floor Base", position + new Vector2(0f, -height * 0.5f + 0.12f), new Vector2(width * 1.18f, 0.28f), new Color(0.08f, 0.075f, 0.1f), 6);
            CreateDecorativeBox(name + " Ground Join Shadow", position + new Vector2(0f, -height * 0.5f + 0.33f), new Vector2(width * 1.04f, 0.08f), new Color(0.015f, 0.014f, 0.02f, 0.82f), 7);

            int joints = Mathf.Max(4, Mathf.RoundToInt(height / 0.75f));
            for (int i = 1; i < joints; i++)
            {
                float y = position.y - height * 0.5f + height * i / joints;
                CreateDecorativeBox(name + " Block Joint", new Vector2(position.x, y), new Vector2(width * 0.84f, 0.025f), new Color(0.03f, 0.03f, 0.045f, 0.58f), 5);
            }
        }

        private static void CreateBonfire(Vector2 position)
        {
            GameObject bonfire = CreateBox("Bonfire", position, new Vector2(0.8f, 1f), Color.white, PixelSpriteFactory.Bonfire(), 2);
            bonfire.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(bonfire, "Interactable");
            bonfire.AddComponent<Bonfire>();
        }

        private static TreasureChest CreateChest(Vector2 position, int coins)
        {
            CreateDecorativeBox("Chest Stone Pedestal", position + new Vector2(0f, -0.42f), new Vector2(1.18f, 0.18f), new Color(0.16f, 0.14f, 0.18f), 1);
            GameObject chest = CreateBox("Treasure Chest", position, new Vector2(0.9f, 0.65f), Color.white, PixelSpriteFactory.Chest(), 2);
            chest.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(chest, "Interactable");
            TreasureChest treasureChest = chest.AddComponent<TreasureChest>();
            treasureChest.SetCoins(coins);
            return treasureChest;
        }

        private static void CreateBreakableCrate(Vector2 position, int coins)
        {
            GameObject crate = CreateBox("Breakable Crate", position, new Vector2(0.82f, 0.72f), Color.white, PixelSpriteFactory.Crate(), 3);
            crate.tag = "Enemy";
            SetLayerIfExists(crate, "Enemy");
            crate.AddComponent<Health>();
            crate.AddComponent<BreakableCrate>().SetCoins(coins);
        }

        private static void CreateLore(Vector2 position, string message)
        {
            GameObject tablet = CreateBox("Lore Tablet", position, new Vector2(0.7f, 0.95f), Color.white, PixelSpriteFactory.LoreTablet(), 2);
            tablet.GetComponent<BoxCollider2D>().isTrigger = true;
            SetLayerIfExists(tablet, "Interactable");
            tablet.AddComponent<LoreTablet>().SetMessage(message);
        }

        private static void CreatePlatform(string name, Vector2 position, Vector2 size, Color color)
        {
            GameObject platform = CreateBox(name, position, size, color, PixelSpriteFactory.Stone(), 1);
            if (IsDropThroughName(name))
            {
                if (platform.TryGetComponent(out BoxCollider2D boxCollider))
                {
                    Object.Destroy(boxCollider);
                }

                CreateDropThroughTopSurface(name + " Top Surface", position, size.x, size.y * 0.5f);
                return;
            }

            SetLayerIfExists(platform, "Ground");
        }

        private static void CreateDropThroughTopSurface(string name, Vector2 position, float width, float localTop)
        {
            GameObject surface = new GameObject(name);
            surface.transform.position = position;
            EdgeCollider2D edgeCollider = surface.AddComponent<EdgeCollider2D>();
            edgeCollider.edgeRadius = 0.04f;
            edgeCollider.points = new[]
            {
                new Vector2(-width * 0.5f, localTop),
                new Vector2(width * 0.5f, localTop)
            };
            SetLayerIfExists(surface, "Ground");
            surface.AddComponent<DropThroughSurface>().Configure(true);
        }

        private static void CreateStaircase(string name, Vector2 basePosition, int steps, float stepWidth, float stepHeight, bool ascendingRight)
        {
            float width = steps * stepWidth;
            float height = steps * stepHeight;
            GameObject ramp = new GameObject(name + " Ramp Collider");
            ramp.transform.position = basePosition;
            EdgeCollider2D collider = ramp.AddComponent<EdgeCollider2D>();
            collider.edgeRadius = 0.03f;
            const float blend = 0.34f;
            if (ascendingRight)
            {
                collider.points = new[]
                {
                    new Vector2(-blend, 0f),
                    Vector2.zero,
                    new Vector2(width, height),
                    new Vector2(width + blend, height)
                };
            }
            else
            {
                collider.points = new[]
                {
                    new Vector2(-blend, height),
                    new Vector2(0f, height),
                    new Vector2(width, 0f),
                    new Vector2(width + blend, 0f)
                };
            }
            SetLayerIfExists(ramp, "Ground");
            ramp.AddComponent<DropThroughSurface>().Configure(true, true, ascendingRight);

            for (int i = 0; i < steps; i++)
            {
                float x = ascendingRight
                    ? basePosition.x + stepWidth * (i + 0.5f)
                    : basePosition.x + stepWidth * (steps - i - 0.5f);
                float y = basePosition.y + stepHeight * (i + 0.5f);
                Color shade = i % 2 == 0 ? new Color(0.29f, 0.27f, 0.34f) : new Color(0.24f, 0.23f, 0.3f);
                CreateDecorativeBox(name + " Stone Step", new Vector2(x, y), new Vector2(stepWidth * 0.98f, stepHeight * 0.92f), shade, 2);
                CreateDecorativeBox(name + " Step Lip", new Vector2(x, y + stepHeight * 0.42f), new Vector2(stepWidth * 0.98f, 0.035f), new Color(0.48f, 0.5f, 0.54f), 3);
            }
        }

        private static void CreateStairConnector(string name, Vector2 position, float width)
        {
            GameObject connector = CreateBox(name, position, new Vector2(width, 0.28f), new Color(0.29f, 0.27f, 0.34f), PixelSpriteFactory.Stone(), 1);
            if (connector.TryGetComponent(out BoxCollider2D boxCollider))
            {
                Object.Destroy(boxCollider);
            }

            GameObject surface = new GameObject(name + " Surface Collider");
            surface.transform.position = position;
            EdgeCollider2D edgeCollider = surface.AddComponent<EdgeCollider2D>();
            edgeCollider.edgeRadius = 0.03f;
            edgeCollider.points = new[]
            {
                new Vector2(-width * 0.5f - 0.24f, 0.14f),
                new Vector2(width * 0.5f + 0.24f, 0.14f)
            };
            SetLayerIfExists(surface, "Ground");
            surface.AddComponent<DropThroughSurface>().Configure(true);
            CreateDecorativeBox(name + " Lip", position + Vector2.up * 0.13f, new Vector2(width * 0.98f, 0.045f), new Color(0.5f, 0.52f, 0.56f), 3);
            CreateDecorativeBox(name + " Shadow", position + Vector2.down * 0.1f, new Vector2(width * 0.94f, 0.08f), new Color(0.08f, 0.075f, 0.1f, 0.82f), 2);
        }

        private static void CreateTreasureGateAndLever(Vector2 leverPosition, Vector2 cagePosition)
        {
            const int cageBackOrder = 0;
            const int cageChestOrder = 1;
            const int cageFrameOrder = 2;
            const int cageBarOrder = 2;

            CreateDecorativeBox("Caged Chest Back Wall", cagePosition + new Vector2(0f, 0.14f), new Vector2(2.25f, 1.8f), new Color(0.055f, 0.055f, 0.076f, 0.82f), cageBackOrder);
            CreateDecorativeBox("Caged Chest Top Stone", cagePosition + new Vector2(0f, 1.03f), new Vector2(2.45f, 0.18f), new Color(0.3f, 0.31f, 0.34f), cageFrameOrder);
            CreateDecorativeBox("Caged Chest Floor Stone", cagePosition + new Vector2(0f, -0.73f), new Vector2(2.45f, 0.18f), new Color(0.16f, 0.15f, 0.2f), cageFrameOrder);
            CreateDecorativeBox("Caged Chest Left Pillar", cagePosition + new Vector2(-1.12f, 0.12f), new Vector2(0.18f, 1.82f), new Color(0.22f, 0.23f, 0.27f), cageFrameOrder);
            CreateDecorativeBox("Caged Chest Right Pillar", cagePosition + new Vector2(1.12f, 0.12f), new Vector2(0.18f, 1.82f), new Color(0.22f, 0.23f, 0.27f), cageFrameOrder);
            for (int i = 0; i < 3; i++)
            {
                float x = -0.72f + i * 0.72f;
                CreateDecorativeBox("Caged Chest Rear Bar", cagePosition + new Vector2(x, 0.12f), new Vector2(0.055f, 1.48f), new Color(0.1f, 0.105f, 0.13f), cageBarOrder);
            }

            TreasureChest cagedChest = CreateChest(cagePosition + new Vector2(0f, -0.42f), 14);
            cagedChest.SetVisualSorting(cageChestOrder, cageChestOrder);

            GameObject gate = new GameObject("World 1-2 Return Chest Gate");
            gate.transform.position = cagePosition + new Vector2(0f, 0.12f);
            BoxCollider2D gateCollider = gate.AddComponent<BoxCollider2D>();
            gateCollider.size = new Vector2(2.08f, 1.7f);
            gateCollider.isTrigger = true;
            SetLayerIfExists(gate, "Interactable");

            CreateChildDecorativeBox("Gate Top Rail", gate.transform, new Vector2(0f, 0.76f), new Vector2(2.1f, 0.1f), new Color(0.37f, 0.38f, 0.42f), cageFrameOrder);
            CreateChildDecorativeBox("Gate Bottom Rail", gate.transform, new Vector2(0f, -0.76f), new Vector2(2.1f, 0.1f), new Color(0.22f, 0.22f, 0.26f), cageFrameOrder);
            for (int i = 0; i < 7; i++)
            {
                float x = -0.84f + i * 0.28f;
                CreateChildDecorativeBox("Gate Iron Bar", gate.transform, new Vector2(x, 0f), new Vector2(0.06f, 1.52f), new Color(0.15f, 0.16f, 0.2f), cageBarOrder);
                CreateChildDecorativeBox("Gate Iron Bar Highlight", gate.transform, new Vector2(x + 0.022f, 0f), new Vector2(0.016f, 1.42f), new Color(0.5f, 0.52f, 0.58f, 0.55f), cageBarOrder);
            }
            SimpleGate simpleGate = gate.AddComponent<SimpleGate>();
            cagedChest.RequireGate(simpleGate);

            CreateMechanicalLever(leverPosition, simpleGate);
        }

        private static void CreateMechanicalLever(Vector2 position, SimpleGate gate)
        {
            GameObject lever = new GameObject("World 1-2 Mechanical Lever");
            lever.transform.position = position;
            BoxCollider2D collider = lever.AddComponent<BoxCollider2D>();
            collider.size = new Vector2(1.12f, 1.45f);
            collider.offset = new Vector2(0f, 0.05f);
            collider.isTrigger = true;
            SetLayerIfExists(lever, "Interactable");

            CreateChildDecorativeBox("Lever Stone Back", lever.transform, new Vector2(0.15f, 0f), new Vector2(0.88f, 1.18f), new Color(0.2f, 0.23f, 0.2f), 2);
            CreateChildDecorativeBox("Lever Stone Top", lever.transform, new Vector2(0.15f, 0.52f), new Vector2(0.82f, 0.17f), new Color(0.33f, 0.35f, 0.32f), 3);
            CreateChildDecorativeBox("Lever Stone Left Chip", lever.transform, new Vector2(-0.32f, 0.06f), new Vector2(0.16f, 0.42f), new Color(0.13f, 0.15f, 0.14f), 3);
            CreateChildDecorativeBox("Lever Stone Mortar A", lever.transform, new Vector2(0.15f, 0.18f), new Vector2(0.76f, 0.035f), new Color(0.08f, 0.09f, 0.085f, 0.72f), 4);
            CreateChildDecorativeBox("Lever Stone Mortar B", lever.transform, new Vector2(0.15f, -0.24f), new Vector2(0.76f, 0.035f), new Color(0.08f, 0.09f, 0.085f, 0.72f), 4);
            CreateChildDecorativeBox("Lever Metal Plate", lever.transform, new Vector2(-0.03f, -0.02f), new Vector2(0.66f, 0.86f), new Color(0.36f, 0.22f, 0.15f), 5);
            CreateChildDecorativeBox("Lever Plate Inner", lever.transform, new Vector2(-0.03f, -0.02f), new Vector2(0.5f, 0.66f), new Color(0.18f, 0.15f, 0.14f), 6);
            CreateChildDecorativeBox("Lever Plate Rust A", lever.transform, new Vector2(0.09f, 0.24f), new Vector2(0.32f, 0.04f), new Color(0.62f, 0.32f, 0.17f, 0.74f), 7);
            CreateChildDecorativeBox("Lever Plate Rust B", lever.transform, new Vector2(-0.14f, -0.3f), new Vector2(0.22f, 0.04f), new Color(0.55f, 0.27f, 0.13f, 0.68f), 7);

            for (int i = 0; i < 4; i++)
            {
                float x = i < 2 ? -0.31f : 0.25f;
                float y = i % 2 == 0 ? 0.33f : -0.37f;
                CreateChildDecorativeBox("Lever Plate Bolt", lever.transform, new Vector2(x, y), new Vector2(0.08f, 0.08f), new Color(0.05f, 0.05f, 0.055f), 8);
                CreateChildDecorativeBox("Lever Bolt Shine", lever.transform, new Vector2(x + 0.015f, y + 0.018f), new Vector2(0.025f, 0.025f), new Color(0.62f, 0.64f, 0.6f), 9);
            }

            Transform handlePivot = new GameObject("Lever Handle Pivot").transform;
            handlePivot.SetParent(lever.transform, false);
            handlePivot.localPosition = new Vector2(-0.2f, 0.05f);
            handlePivot.localRotation = Quaternion.Euler(0f, 0f, 34f);
            CreateChildDecorativeBox("Lever Wood Handle", handlePivot, new Vector2(0f, 0.34f), new Vector2(0.17f, 0.78f), new Color(0.37f, 0.24f, 0.14f), 9);
            CreateChildDecorativeBox("Lever Wood Highlight", handlePivot, new Vector2(-0.045f, 0.34f), new Vector2(0.035f, 0.66f), new Color(0.62f, 0.43f, 0.25f, 0.75f), 10);
            CreateChildDecorativeBox("Lever Wood Cap", handlePivot, new Vector2(0f, 0.75f), new Vector2(0.25f, 0.13f), new Color(0.52f, 0.5f, 0.45f), 10);
            CreateChildDecorativeBox("Lever Metal Collar", handlePivot, new Vector2(0f, -0.05f), new Vector2(0.24f, 0.11f), new Color(0.48f, 0.47f, 0.43f), 10);

            CreateChildDecorativeBox("Lever Gear Core", lever.transform, new Vector2(-0.31f, -0.42f), new Vector2(0.38f, 0.38f), new Color(0.2f, 0.17f, 0.14f), 8);
            for (int i = 0; i < 10; i++)
            {
                float angle = i * Mathf.PI * 2f / 10f;
                Vector2 tooth = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * 0.25f;
                GameObject gearTooth = CreateChildDecorativeBox("Lever Gear Tooth", lever.transform, new Vector2(-0.31f, -0.42f) + tooth, new Vector2(0.08f, 0.16f), new Color(0.32f, 0.27f, 0.21f), 7);
                gearTooth.transform.localRotation = Quaternion.Euler(0f, 0f, angle * Mathf.Rad2Deg);
            }
            CreateChildDecorativeBox("Lever Gear Hub", lever.transform, new Vector2(-0.31f, -0.42f), new Vector2(0.12f, 0.12f), new Color(0.07f, 0.06f, 0.055f), 10);
            CreateChildDecorativeBox("Lever Chain A", lever.transform, new Vector2(-0.47f, -0.68f), new Vector2(0.035f, 0.26f), new Color(0.08f, 0.075f, 0.07f), 7);
            CreateChildDecorativeBox("Lever Chain B", lever.transform, new Vector2(-0.4f, -0.7f), new Vector2(0.035f, 0.22f), new Color(0.08f, 0.075f, 0.07f), 7);
            SpriteRenderer glow = CreateChildDecorativeBox("Lever Active Glow", lever.transform, new Vector2(0.26f, -0.38f), new Vector2(0.09f, 0.09f), new Color(1f, 0.75f, 0.28f, 0.42f), 11).GetComponent<SpriteRenderer>();

            GateLever gateLever = lever.AddComponent<GateLever>();
            gateLever.Configure(gate, handlePivot, glow);
        }

        private static GameObject CreateChildDecorativeBox(string name, Transform parent, Vector2 localPosition, Vector2 size, Color color, int sortingOrder)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPosition;
            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = GetWhitePixel();
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
            go.transform.localScale = size;
            return go;
        }

        private static bool IsDropThroughName(string name)
        {
            return name.Contains("Platform")
                || name.Contains("Walkway")
                || name.Contains("Balcony")
                || name.Contains("Ledge");
        }

        private static void CreateFloatingPlatformDetails(Vector2 position, float width)
        {
            CreateDecorativeBox("Floating Platform Front Shadow", position + new Vector2(0f, -0.17f), new Vector2(width * 0.96f, 0.18f), new Color(0.08f, 0.075f, 0.1f, 0.9f), 2);
            CreateDecorativeBox("Floating Platform Left Chip", position + new Vector2(-width * 0.42f, -0.28f), new Vector2(0.28f, 0.16f), new Color(0.16f, 0.14f, 0.2f), 2);
            CreateDecorativeBox("Floating Platform Right Chip", position + new Vector2(width * 0.36f, -0.29f), new Vector2(0.36f, 0.14f), new Color(0.13f, 0.12f, 0.17f), 2);
            CreateDecorativeBox("Floating Platform Crack A", position + new Vector2(-width * 0.18f, 0.02f), new Vector2(0.34f, 0.035f), new Color(0.07f, 0.065f, 0.09f, 0.75f), 2);
            CreateDecorativeBox("Floating Platform Crack B", position + new Vector2(width * 0.18f, -0.08f), new Vector2(0.04f, 0.22f), new Color(0.07f, 0.065f, 0.09f, 0.7f), 2);
        }

        private static void CreateGroundSurfaceDetails(Vector2 position, Vector2 size)
        {
            float top = position.y + size.y * 0.5f;
            float bottom = position.y - size.y * 0.5f;
            int blocks = Mathf.Max(2, Mathf.RoundToInt(size.x / 0.85f));

            CreateDecorativeBox("Ground Stone Edge", new Vector2(position.x, top - 0.08f), new Vector2(size.x * 1.01f, 0.08f), new Color(0.42f, 0.46f, 0.49f), 2);
            CreateDecorativeBox("Ground Inner Shadow", new Vector2(position.x, top - 0.22f), new Vector2(size.x * 0.99f, 0.12f), new Color(0.09f, 0.08f, 0.12f, 0.72f), 1);
            CreateDecorativeBox("Ground Underside Shadow", new Vector2(position.x, bottom + 0.08f), new Vector2(size.x * 0.98f, 0.16f), new Color(0.07f, 0.065f, 0.09f, 0.88f), 1);

            for (int i = 0; i <= blocks; i++)
            {
                float x = position.x - size.x * 0.5f + i * size.x / blocks;
                float jointHeight = i % 2 == 0 ? size.y * 0.58f : size.y * 0.38f;
                CreateDecorativeBox("Ground Block Joint", new Vector2(x, position.y - size.y * 0.12f), new Vector2(0.035f, jointHeight), new Color(0.11f, 0.1f, 0.14f, 0.58f), 2);
            }

            int cracks = Mathf.Clamp(Mathf.RoundToInt(size.x / 2.8f), 1, 12);
            for (int i = 0; i < cracks; i++)
            {
                float t = (i + 0.43f) / (cracks + 0.65f);
                float x = position.x - size.x * 0.45f + size.x * 0.9f * t;
                float y = top - 0.28f + Mathf.Sin((position.x + i) * 1.7f) * size.y * 0.08f;
                CreateDecorativeBox("Ground Crack Main", new Vector2(x, y), new Vector2(0.04f, Mathf.Min(0.3f, size.y * 0.3f)), new Color(0.065f, 0.06f, 0.09f, 0.68f), 2);
                CreateDecorativeBox("Ground Crack Branch", new Vector2(x + 0.11f, y - 0.06f), new Vector2(0.18f, 0.03f), new Color(0.065f, 0.06f, 0.09f, 0.62f), 2);
            }
        }

        private static void CreateBackdrop()
        {
            CreateCastleExteriorBackdrop(new Vector2(19f, 2.55f), new Vector2(58f, 7.8f), 24.6f);
            CreateSolidBackWall(new Vector2(19f, 2.15f), new Vector2(41.5f, 5.8f), "Back Wall");
            CreateDecorativeBox("Low Fog Band", new Vector2(19f, 0.18f), new Vector2(54f, 1.35f), new Color(0.37f, 0.48f, 0.55f, 0.24f), -2);
        }

        private static void CreateCastleExteriorBackdrop(Vector2 position, Vector2 size, float moonX)
        {
            CreateDecorativeBox("Exterior Deep Black", position + new Vector2(0f, -size.y * 0.55f), new Vector2(size.x, size.y * 0.62f), new Color(0.005f, 0.006f, 0.01f), -12);
            CreateDecorativeBox("Exterior Night Sky", position + Vector2.up * 0.7f, new Vector2(size.x, size.y), new Color(0.025f, 0.035f, 0.07f), -11);
            CreateDecorativeBox("Cold Moon Haze", position + new Vector2(0f, 1.0f), new Vector2(size.x, size.y * 0.46f), new Color(0.08f, 0.13f, 0.19f, 0.66f), -10);

            float top = position.y + size.y * 0.5f;
            float moonY = top - 1.25f;
            CreateMoon(new Vector2(moonX, moonY), 1.45f);
            CreateCloudBank(new Vector2(moonX - 3.1f, moonY - 0.05f), 4.2f, -8);
            CreateCloudBank(new Vector2(moonX + 3.7f, moonY - 0.38f), 4.9f, -8);
            CreateDistantForest(new Vector2(position.x, position.y - size.y * 0.08f), size.x, -8);
            CreateDistantForest(new Vector2(position.x + 0.8f, position.y - size.y * 0.22f), size.x * 0.96f, -7);
            CreateDecorativeBox("Forest Ground Fade", position + new Vector2(0f, -size.y * 0.45f), new Vector2(size.x, size.y * 0.28f), new Color(0.004f, 0.005f, 0.008f, 0.9f), -7);
        }

        private static void CreateMoon(Vector2 position, float size)
        {
            CreateDecorativeBox("Moon Glow Wide", position, new Vector2(size * 2.6f, size * 2.6f), new Color(0.55f, 0.68f, 0.76f, 0.12f), -9);
            CreateDecorativeBox("Moon Disc", position, new Vector2(size, size), new Color(0.78f, 0.88f, 0.9f, 0.84f), -8);
            CreateDecorativeBox("Moon Shadow Bite", position + new Vector2(size * 0.23f, size * 0.11f), new Vector2(size * 0.58f, size * 0.72f), new Color(0.58f, 0.69f, 0.78f, 0.28f), -7);
        }

        private static void CreateCloudBank(Vector2 position, float width, int sortingOrder)
        {
            Color cloud = new Color(0.16f, 0.21f, 0.28f, 0.54f);
            CreateDecorativeBox("Moon Cloud Main", position, new Vector2(width, 0.28f), cloud, sortingOrder);
            CreateDecorativeBox("Moon Cloud Low", position + new Vector2(width * 0.12f, -0.18f), new Vector2(width * 0.72f, 0.22f), new Color(0.11f, 0.16f, 0.22f, 0.48f), sortingOrder);
            CreateDecorativeBox("Moon Cloud High", position + new Vector2(-width * 0.18f, 0.18f), new Vector2(width * 0.46f, 0.2f), new Color(0.22f, 0.28f, 0.34f, 0.35f), sortingOrder);
        }

        private static void CreateDistantForest(Vector2 position, float width, int sortingOrder)
        {
            int trees = Mathf.Max(18, Mathf.RoundToInt(width / 1.15f));
            for (int i = 0; i < trees; i++)
            {
                float t = (i + 0.5f) / trees;
                float x = position.x - width * 0.5f + width * t;
                float height = 0.9f + Mathf.Abs(Mathf.Sin((x + sortingOrder) * 0.83f)) * 1.65f;
                float trunkHeight = height * 0.58f;
                Color trunk = sortingOrder <= -7 ? new Color(0.018f, 0.035f, 0.032f, 0.78f) : new Color(0.006f, 0.018f, 0.016f, 0.92f);
                Color crown = sortingOrder <= -7 ? new Color(0.02f, 0.052f, 0.043f, 0.84f) : new Color(0.004f, 0.022f, 0.018f, 0.96f);

                CreateDecorativeBox("Distant Pine Trunk", new Vector2(x, position.y - height * 0.3f), new Vector2(0.08f, trunkHeight), trunk, sortingOrder);
                CreateDecorativeBox("Distant Pine Crown Low", new Vector2(x, position.y + height * 0.02f), new Vector2(0.46f, height * 0.38f), crown, sortingOrder);
                CreateDecorativeBox("Distant Pine Crown Mid", new Vector2(x, position.y + height * 0.24f), new Vector2(0.34f, height * 0.32f), crown, sortingOrder);
                CreateDecorativeBox("Distant Pine Crown Top", new Vector2(x, position.y + height * 0.43f), new Vector2(0.2f, height * 0.24f), crown, sortingOrder);
            }
        }

        private static void CreateSolidBackWall(Vector2 position, Vector2 size, string name)
        {
            CreateDecorativeBox(name, position, size, new Color(0.08f, 0.085f, 0.13f, 0.92f), -6);
            CreateBrickWallDetails(position, size);
        }

        private static void CreatePartialBackWall(Vector2 position, Vector2 size)
        {
            CreateDecorativeBox("Back Wall Left Panel", position + new Vector2(-size.x * 0.28f, 0f), new Vector2(size.x * 0.18f, size.y), new Color(0.08f, 0.085f, 0.13f, 0.78f), -3);
            CreateDecorativeBox("Back Wall Mid Low Panel", position + new Vector2(0f, -size.y * 0.31f), new Vector2(size.x * 0.34f, size.y * 0.32f), new Color(0.08f, 0.085f, 0.13f, 0.72f), -3);
            CreateDecorativeBox("Back Wall Right Panel", position + new Vector2(size.x * 0.3f, 0f), new Vector2(size.x * 0.18f, size.y), new Color(0.08f, 0.085f, 0.13f, 0.78f), -3);
            CreateBrickWallDetails(position, size);
        }

        private static void CreateBrickWallDetails(Vector2 position, Vector2 size)
        {
            float left = position.x - size.x * 0.5f;
            float bottom = position.y - size.y * 0.5f;
            float rowHeight = 0.42f;
            float brickWidth = 1.15f;
            int rows = Mathf.CeilToInt(size.y / rowHeight);

            for (int row = 0; row <= rows; row++)
            {
                float y = bottom + row * rowHeight;
                CreateDecorativeBox("Back Wall Mortar H", new Vector2(position.x, y), new Vector2(size.x, 0.025f), new Color(0.035f, 0.036f, 0.052f, 0.58f), -5);

                float offset = row % 2 == 0 ? 0f : brickWidth * 0.5f;
                int columns = Mathf.CeilToInt(size.x / brickWidth) + 1;
                for (int column = 0; column <= columns; column++)
                {
                    float x = left + column * brickWidth + offset;
                    if (x < left || x > left + size.x) continue;
                    CreateDecorativeBox("Back Wall Mortar V", new Vector2(x, y + rowHeight * 0.5f), new Vector2(0.024f, rowHeight * 0.82f), new Color(0.035f, 0.036f, 0.052f, 0.5f), -5);

                    if ((row * 17 + column * 11) % 9 == 0)
                    {
                        CreateDecorativeBox("Back Wall Brick Shade", new Vector2(x + brickWidth * 0.28f, y + rowHeight * 0.5f), new Vector2(brickWidth * 0.42f, rowHeight * 0.42f), new Color(0.055f, 0.058f, 0.082f, 0.28f), -5);
                    }

                    if ((row * 13 + column * 7) % 14 == 0)
                    {
                        CreateDecorativeBox("Back Wall Brick Highlight", new Vector2(x + brickWidth * 0.12f, y + rowHeight * 0.76f), new Vector2(brickWidth * 0.38f, 0.025f), new Color(0.18f, 0.2f, 0.24f, 0.22f), -4);
                    }
                }
            }

            CreateWallCrack(new Vector2(position.x - size.x * 0.25f, position.y + size.y * 0.1f), size.y * 0.2f);
            CreateWallCrack(new Vector2(position.x + size.x * 0.055f, position.y + size.y * 0.19f), size.y * 0.27f);
            CreateWallCrack(new Vector2(position.x + size.x * 0.38f, position.y - size.y * 0.01f), size.y * 0.19f);
            CreateBrokenWallPatch(new Vector2(position.x - size.x * 0.1f, position.y - size.y * 0.22f), new Vector2(size.x * 0.05f, size.y * 0.16f));
            CreateBrokenWallPatch(new Vector2(position.x + size.x * 0.295f, position.y + size.y * 0.345f), new Vector2(size.x * 0.057f, size.y * 0.13f));
            CreateDecorativeBox("Back Wall Deep Shadow Left", new Vector2(left - 2.25f, position.y + size.y * 0.035f), new Vector2(1.4f, size.y * 1.07f), new Color(0.025f, 0.026f, 0.04f, 0.72f), -4);
            CreateDecorativeBox("Back Wall Deep Shadow Right", new Vector2(left + size.x + 2.25f, position.y + size.y * 0.01f), new Vector2(1.6f, size.y * 1.1f), new Color(0.025f, 0.026f, 0.04f, 0.72f), -4);
        }

        private static void CreateWallCrack(Vector2 position, float height)
        {
            CreateDecorativeBox("Wall Crack Core", position, new Vector2(0.04f, height), new Color(0.015f, 0.015f, 0.024f, 0.7f), -4);
            CreateDecorativeBox("Wall Crack Branch A", position + new Vector2(0.16f, height * 0.18f), new Vector2(0.32f, 0.035f), new Color(0.015f, 0.015f, 0.024f, 0.62f), -4);
            CreateDecorativeBox("Wall Crack Branch B", position + new Vector2(-0.14f, -height * 0.18f), new Vector2(0.28f, 0.035f), new Color(0.015f, 0.015f, 0.024f, 0.62f), -4);
            CreateDecorativeBox("Wall Crack Dust", position + new Vector2(0.08f, -height * 0.48f), new Vector2(0.45f, 0.08f), new Color(0.2f, 0.21f, 0.24f, 0.16f), -4);
        }

        private static void CreateBrokenWallPatch(Vector2 position, Vector2 size)
        {
            CreateDecorativeBox("Broken Wall Patch Shadow", position, size, new Color(0.035f, 0.035f, 0.052f, 0.56f), -4);
            CreateDecorativeBox("Broken Wall Patch Top", position + new Vector2(0f, size.y * 0.36f), new Vector2(size.x * 0.86f, 0.05f), new Color(0.2f, 0.21f, 0.25f, 0.24f), -3);
            CreateDecorativeBox("Broken Wall Patch Side", position + new Vector2(-size.x * 0.42f, 0f), new Vector2(0.05f, size.y * 0.72f), new Color(0.18f, 0.18f, 0.22f, 0.2f), -3);
            CreateDecorativeBox("Broken Wall Missing Brick A", position + new Vector2(-size.x * 0.16f, size.y * 0.06f), new Vector2(size.x * 0.22f, size.y * 0.2f), new Color(0.02f, 0.02f, 0.03f, 0.32f), -3);
            CreateDecorativeBox("Broken Wall Missing Brick B", position + new Vector2(size.x * 0.22f, -size.y * 0.14f), new Vector2(size.x * 0.28f, size.y * 0.18f), new Color(0.02f, 0.02f, 0.03f, 0.28f), -3);
        }

        private static void CreateWallTorch(Vector2 position, bool flip)
        {
            GameObject baseSprite = CreateDecorativeSprite("Wall Torch Base", position, new Vector2(1.1f, 1.35f), Color.white, PixelSpriteFactory.WallTorchBase(), 2);
            GameObject flame = CreateDecorativeSprite("Wall Torch Flame", position, new Vector2(1.1f, 1.35f), Color.white, PixelSpriteFactory.WallTorchFlame(), 3);
            baseSprite.GetComponent<SpriteRenderer>().flipX = flip;
            flame.GetComponent<SpriteRenderer>().flipX = flip;
            flame.AddComponent<FlickerSprite>();
        }

        private static void CreateFloorBrazier(Vector2 position)
        {
            CreateDecorativeSprite("Floor Brazier Base", position, new Vector2(0.9f, 1.45f), Color.white, PixelSpriteFactory.FloorBrazierBase(), 2);
            CreateDecorativeSprite("Floor Brazier Flame", position, new Vector2(0.9f, 1.45f), Color.white, PixelSpriteFactory.FloorBrazierFlame(), 3).AddComponent<FlickerSprite>();
        }

        private static void CreateGothicWindow(Vector2 position, float width, float height, Color glow)
        {
            CreateDecorativeBox("Gothic Window Recess", position, new Vector2(width, height), new Color(0.01f, 0.014f, 0.026f), -1);
            CreateWindowForestView(position, width, height);

            Color paneColor = new Color(glow.r, glow.g, glow.b, Mathf.Min(glow.a, 0.24f));
            CreateDecorativeBox("Gothic Window Pane Left", position + new Vector2(-width * 0.22f, -height * 0.06f), new Vector2(width * 0.18f, height * 0.7f), paneColor, 1);
            CreateDecorativeBox("Gothic Window Pane Mid", position + new Vector2(0f, -height * 0.06f), new Vector2(width * 0.18f, height * 0.74f), paneColor, 1);
            CreateDecorativeBox("Gothic Window Pane Right", position + new Vector2(width * 0.22f, -height * 0.06f), new Vector2(width * 0.18f, height * 0.7f), paneColor, 1);
            CreateDecorativeBox("Gothic Window Arch", position + Vector2.up * height * 0.42f, new Vector2(width * 0.76f, height * 0.22f), new Color(0.18f, 0.2f, 0.24f), 2);
            CreateDecorativeBox("Window Center Bar", position, new Vector2(0.06f, height * 0.82f), new Color(0.08f, 0.08f, 0.11f), 3);
            CreateDecorativeBox("Window Left Bar", position + Vector2.left * width * 0.2f, new Vector2(0.045f, height * 0.66f), new Color(0.08f, 0.08f, 0.11f), 3);
            CreateDecorativeBox("Window Right Bar", position + Vector2.right * width * 0.2f, new Vector2(0.045f, height * 0.66f), new Color(0.08f, 0.08f, 0.11f), 3);
            CreateDecorativeBox("Window Cross A", position + Vector2.up * height * 0.08f, new Vector2(width * 0.7f, 0.055f), new Color(0.08f, 0.08f, 0.11f), 3);
            CreateDecorativeBox("Window Cross B", position + Vector2.down * height * 0.22f, new Vector2(width * 0.62f, 0.055f), new Color(0.08f, 0.08f, 0.11f), 3);
            CreateDecorativeBox("Window Stone Left", position + Vector2.left * width * 0.5f, new Vector2(0.12f, height), new Color(0.23f, 0.24f, 0.27f), 2);
            CreateDecorativeBox("Window Stone Right", position + Vector2.right * width * 0.5f, new Vector2(0.12f, height), new Color(0.23f, 0.24f, 0.27f), 2);
            CreateDecorativeBox("Window Stone Base", position + Vector2.down * height * 0.49f, new Vector2(width * 1.1f, 0.16f), new Color(0.21f, 0.22f, 0.25f), 2);
            CreateDecorativeBox("Window Lightning Flash", position, new Vector2(width * 0.78f, height * 0.76f), new Color(0.76f, 0.9f, 1f, 0f), 4).AddComponent<LightningFlash>();
        }

        private static void CreateWindowForestView(Vector2 position, float width, float height)
        {
            CreateDecorativeBox("Window Night View", position + Vector2.up * height * 0.04f, new Vector2(width * 0.74f, height * 0.76f), new Color(0.014f, 0.025f, 0.05f), 0);
            CreateDecorativeBox("Window Moonlit Mist", position + Vector2.up * height * 0.14f, new Vector2(width * 0.66f, height * 0.18f), new Color(0.16f, 0.24f, 0.28f, 0.22f), 0);

            int trees = Mathf.Max(3, Mathf.RoundToInt(width * 3.4f));
            for (int i = 0; i < trees; i++)
            {
                float t = (i + 0.5f) / trees;
                float x = position.x - width * 0.31f + width * 0.62f * t;
                float treeHeight = height * (0.24f + Mathf.Abs(Mathf.Sin((position.x + i) * 0.91f)) * 0.22f);
                float baseY = position.y - height * 0.28f;
                CreateDecorativeBox("Window Pine Trunk", new Vector2(x, baseY + treeHeight * 0.04f), new Vector2(width * 0.026f, treeHeight * 0.72f), new Color(0.005f, 0.012f, 0.012f, 0.88f), 0);
                CreateDecorativeBox("Window Pine Crown Low", new Vector2(x, baseY + treeHeight * 0.24f), new Vector2(width * 0.16f, treeHeight * 0.36f), new Color(0.005f, 0.022f, 0.018f, 0.92f), 0);
                CreateDecorativeBox("Window Pine Crown Top", new Vector2(x, baseY + treeHeight * 0.44f), new Vector2(width * 0.09f, treeHeight * 0.28f), new Color(0.006f, 0.027f, 0.022f, 0.92f), 0);
            }
        }

        private static void CreateColumn(Vector2 position, float height)
        {
            CreateDecorativeBox("Column Shadow", position, new Vector2(0.62f, height), new Color(0.055f, 0.055f, 0.08f), -1);
            CreateDecorativeBox("Column Core", position, new Vector2(0.34f, height), new Color(0.24f, 0.25f, 0.29f), 1);
            CreateDecorativeBox("Column Left Edge", position + Vector2.left * 0.2f, new Vector2(0.08f, height), new Color(0.12f, 0.13f, 0.17f), 2);
            CreateDecorativeBox("Column Right Edge", position + Vector2.right * 0.2f, new Vector2(0.08f, height), new Color(0.33f, 0.35f, 0.39f), 2);
            CreateDecorativeBox("Column Base", position + Vector2.down * height * 0.5f, new Vector2(0.86f, 0.18f), new Color(0.29f, 0.3f, 0.34f), 2);
            CreateDecorativeBox("Column Capital", position + Vector2.up * height * 0.5f, new Vector2(0.98f, 0.22f), new Color(0.3f, 0.31f, 0.35f), 2);
            for (int i = 1; i < 5; i++)
            {
                float y = position.y - height * 0.5f + height * i / 5f;
                CreateDecorativeBox("Column Block Joint", new Vector2(position.x, y), new Vector2(0.52f, 0.035f), new Color(0.11f, 0.11f, 0.15f), 3);
            }
        }

        private static void CreatePlatformTrim(Vector2 position, float width)
        {
            CreateDecorativeBox("Platform Highlight", position + Vector2.up * 0.08f, new Vector2(width, 0.08f), new Color(0.48f, 0.53f, 0.55f), 3);
            CreateDecorativeBox("Platform Drip Shadow", position + Vector2.down * 0.12f, new Vector2(width * 0.92f, 0.08f), new Color(0.07f, 0.07f, 0.1f), 2);
            int cracks = Mathf.Max(2, Mathf.RoundToInt(width / 1.4f));
            for (int i = 0; i < cracks; i++)
            {
                float x = position.x - width * 0.46f + i * width / cracks;
                CreateDecorativeBox("Stone Joint", new Vector2(x, position.y - 0.02f), new Vector2(0.035f, 0.18f), new Color(0.12f, 0.12f, 0.16f), 4);
            }
        }

        private static void CreateHangingBlade(Vector2 anchor, float chainHeight, bool axe)
        {
            CreateChain(anchor, chainHeight);
            Vector2 bladePosition = anchor + Vector2.down * chainHeight;
            if (axe)
            {
                CreateDecorativeBox("Hanging Axe Handle", bladePosition + Vector2.up * 0.1f, new Vector2(0.12f, 0.72f), new Color(0.19f, 0.14f, 0.11f), 5);
                CreateDecorativeBox("Hanging Axe Head", bladePosition + new Vector2(0.2f, 0.02f), new Vector2(0.55f, 0.32f), new Color(0.49f, 0.53f, 0.56f), 5);
                CreateDecorativeBox("Hanging Axe Edge", bladePosition + new Vector2(0.36f, 0.02f), new Vector2(0.12f, 0.38f), new Color(0.78f, 0.83f, 0.85f), 6);
            }
            else
            {
                CreateDecorativeBox("Hanging Blade Core", bladePosition, new Vector2(0.16f, 0.85f), new Color(0.47f, 0.49f, 0.5f), 5);
                CreateDecorativeBox("Hanging Blade Edge", bladePosition + Vector2.right * 0.1f, new Vector2(0.08f, 0.8f), new Color(0.78f, 0.82f, 0.84f), 6);
                CreateDecorativeBox("Blade Spike Left", bladePosition + new Vector2(-0.18f, 0.08f), new Vector2(0.32f, 0.08f), new Color(0.55f, 0.36f, 0.28f), 5);
                CreateDecorativeBox("Blade Spike Right", bladePosition + new Vector2(0.18f, -0.12f), new Vector2(0.32f, 0.08f), new Color(0.55f, 0.36f, 0.28f), 5);
            }
        }

        private static void CreateIronFence(Vector2 position, float width)
        {
            CreateDecorativeBox("Fence Bottom Rail", position, new Vector2(width, 0.08f), new Color(0.07f, 0.07f, 0.09f), 4);
            CreateDecorativeBox("Fence Top Rail", position + Vector2.up * 0.44f, new Vector2(width, 0.08f), new Color(0.08f, 0.08f, 0.1f), 4);
            int bars = Mathf.Max(4, Mathf.RoundToInt(width / 0.36f));
            for (int i = 0; i <= bars; i++)
            {
                float x = position.x - width * 0.5f + width * i / bars;
                CreateDecorativeBox("Fence Bar", new Vector2(x, position.y + 0.22f), new Vector2(0.045f, 0.56f), new Color(0.08f, 0.08f, 0.1f), 5);
                CreateDecorativeBox("Fence Spike", new Vector2(x, position.y + 0.56f), new Vector2(0.09f, 0.16f), new Color(0.09f, 0.09f, 0.12f), 5);
            }
        }

        private static void CreateChainArc(Vector2 start, Vector2 end, int links)
        {
            for (int i = 0; i <= links; i++)
            {
                float t = i / (float)links;
                Vector2 point = Vector2.Lerp(start, end, t);
                point.y -= Mathf.Sin(t * Mathf.PI) * 0.45f;
                Vector2 size = i % 2 == 0 ? new Vector2(0.16f, 0.07f) : new Vector2(0.07f, 0.16f);
                CreateDecorativeBox("Sagging Chain Link", point, size, new Color(0.28f, 0.29f, 0.33f), 4);
            }
        }

        private static void CreateBanner(Vector2 position, Color color)
        {
            CreateDecorativeBox("Banner Rope", position + Vector2.up * 0.62f, new Vector2(0.8f, 0.06f), new Color(0.09f, 0.07f, 0.05f), 0);
            CreateDecorativeBox("Torn Banner", position, new Vector2(0.7f, 1.1f), color, 0);
            CreateDecorativeBox("Banner Cut", position + new Vector2(0.18f, -0.48f), new Vector2(0.24f, 0.35f), new Color(0.12f, 0.1f, 0.14f), 1);
        }

        private static void CreateWindow(Vector2 position)
        {
            CreateDecorativeBox("Window Frame", position, new Vector2(0.74f, 1.08f), new Color(0.07f, 0.06f, 0.1f), 0);
            CreateDecorativeBox("Window Light", position, new Vector2(0.48f, 0.82f), new Color(0.95f, 0.68f, 0.28f), 0).AddComponent<FlickerSprite>();
            CreateDecorativeBox("Window Bar V", position, new Vector2(0.06f, 0.82f), new Color(0.08f, 0.06f, 0.08f), 1);
            CreateDecorativeBox("Window Bar H", position, new Vector2(0.48f, 0.06f), new Color(0.08f, 0.06f, 0.08f), 1);
        }

        private static void CreateChain(Vector2 position, float height)
        {
            int links = Mathf.Max(2, Mathf.RoundToInt(height / 0.16f));
            for (int i = 0; i < links; i++)
            {
                float y = position.y - i * 0.16f;
                Vector2 size = i % 2 == 0 ? new Vector2(0.16f, 0.07f) : new Vector2(0.07f, 0.16f);
                CreateDecorativeBox("Chain Link", new Vector2(position.x, y), size, new Color(0.33f, 0.34f, 0.38f), 1);
            }
        }

        private static void CreateMist(Vector2 position, float width)
        {
            GameObject mist = CreateDecorativeBox("Ground Mist", position, new Vector2(width, 0.35f), new Color(0.7f, 0.82f, 0.9f, 0.16f), 4);
            mist.AddComponent<DriftSprite>().Configure(new Vector2(0.32f, 0.03f), 0.28f);
        }

        private static void CreateAmbientDust()
        {
            for (int i = 0; i < 34; i++)
            {
                float x = 1.4f + i * 1.16f;
                float y = 0.55f + Mathf.Abs(Mathf.Sin(i * 1.73f)) * 4.1f;
                float size = 0.035f + (i % 4) * 0.012f;
                GameObject dust = CreateDecorativeBox("Floating Dust", new Vector2(x, y), new Vector2(size, size), new Color(0.72f, 0.78f, 0.84f, 0.18f), 2);
                dust.AddComponent<DriftSprite>().Configure(new Vector2(0.04f + (i % 3) * 0.02f, 0.025f), 0.36f + (i % 5) * 0.07f);
            }

            CreateEmbers(new Vector2(4.7f, 0.82f), 5);
            CreateEmbers(new Vector2(22.4f, 0.82f), 5);
            CreateEmbers(new Vector2(6.9f, 1.65f), 4);
            CreateEmbers(new Vector2(30.2f, 3.25f), 4);
            CreateEmbers(new Vector2(37.1f, 2.3f), 4);
        }

        private static void CreateEmbers(Vector2 position, int count)
        {
            for (int i = 0; i < count; i++)
            {
                Vector2 offset = new Vector2((i - count * 0.5f) * 0.08f, i * 0.08f);
                GameObject ember = CreateDecorativeBox("Torch Ember", position + offset, new Vector2(0.045f, 0.08f), new Color(1f, 0.5f, 0.16f, 0.42f), 6);
                ember.AddComponent<DriftSprite>().Configure(new Vector2(0.02f, 0.16f + i * 0.02f), 0.28f);
            }
        }

        private static void CreateBrokenStatue(Vector2 position)
        {
            CreateDecorativeBox("Broken Statue Base", position + new Vector2(0f, -0.46f), new Vector2(0.9f, 0.24f), new Color(0.42f, 0.4f, 0.46f), 1);
            CreateDecorativeBox("Broken Statue Body", position, new Vector2(0.46f, 0.82f), new Color(0.52f, 0.5f, 0.56f), 1);
            CreateDecorativeBox("Broken Statue Shoulder", position + new Vector2(0.1f, 0.35f), new Vector2(0.66f, 0.18f), new Color(0.62f, 0.6f, 0.65f), 1);
            CreateDecorativeBox("Broken Statue Head", position + new Vector2(-0.16f, 0.74f), new Vector2(0.24f, 0.24f), new Color(0.58f, 0.56f, 0.62f), 1);
            CreateDecorativeBox("Statue Crack", position + new Vector2(0.05f, 0.06f), new Vector2(0.05f, 0.6f), new Color(0.17f, 0.15f, 0.2f), 2);
        }

        private static void CreateCeilingBlade(Vector2 anchorPosition, float length, float phase)
        {
            GameObject blade = new GameObject("Ceiling Blade");
            blade.transform.position = anchorPosition;
            blade.AddComponent<CeilingBladeHazard>().Configure(length, phase);
        }

        private static void CreateSpikes(Vector2 position, int damage, float width = 1.65f)
        {
            GameObject spikes = CreateBox("Floor Spikes", position, new Vector2(width, 0.42f), Color.white, PixelSpriteFactory.Spikes(), 7);
            spikes.GetComponent<BoxCollider2D>().isTrigger = true;
            spikes.AddComponent<DamageHazard>().Configure(damage, 0.85f);
        }

        private static void CreateDangerMarker(Vector2 position, float width)
        {
            CreateDecorativeBox("Trap Warning Plate", position + Vector2.down * 0.03f, new Vector2(width, 0.08f), new Color(0.11f, 0.09f, 0.08f, 0.9f), 2);
            CreateDecorativeBox("Trap Rust Scratch A", position + new Vector2(-width * 0.18f, 0.02f), new Vector2(width * 0.22f, 0.025f), new Color(0.64f, 0.29f, 0.11f, 0.75f), 3);
            CreateDecorativeBox("Trap Rust Scratch B", position + new Vector2(width * 0.17f, 0f), new Vector2(width * 0.16f, 0.025f), new Color(0.86f, 0.54f, 0.2f, 0.55f), 3);
        }

        private static void CreateCrouchCue(Vector2 position)
        {
            CreateDecorativeBox("Crouch Cue Floor Wear", position, new Vector2(1.45f, 0.075f), new Color(0.62f, 0.58f, 0.46f, 0.42f), 5);
            CreateDecorativeBox("Crouch Cue Low Arrow A", position + new Vector2(-0.28f, 0.1f), new Vector2(0.34f, 0.035f), new Color(0.88f, 0.74f, 0.42f, 0.62f), 6);
            CreateDecorativeBox("Crouch Cue Low Arrow B", position + new Vector2(0.28f, 0.1f), new Vector2(0.34f, 0.035f), new Color(0.88f, 0.74f, 0.42f, 0.62f), 6);
            CreateDecorativeBox("Crouch Cue Down Stroke", position + new Vector2(0f, 0.17f), new Vector2(0.05f, 0.26f), new Color(0.88f, 0.74f, 0.42f, 0.58f), 6);
        }

        private static GameObject CreateDecorativeBox(string name, Vector2 position, Vector2 size, Color color, int sortingOrder)
        {
            GameObject go = new GameObject(name);
            go.transform.position = position;
            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = GetWhitePixel();
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
            go.transform.localScale = size;
            return go;
        }

        private static GameObject CreateDecorativeSprite(string name, Vector2 position, Vector2 size, Color color, Sprite sprite, int sortingOrder)
        {
            GameObject go = new GameObject(name);
            go.transform.position = position;
            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
            Vector2 spriteSize = renderer.sprite.bounds.size;
            go.transform.localScale = new Vector3(size.x / spriteSize.x, size.y / spriteSize.y, 1f);
            return go;
        }

        private static GameObject CreateBox(string name, Vector2 position, Vector2 size, Color color, Sprite sprite, int sortingOrder)
        {
            GameObject go = new GameObject(name);
            go.transform.position = position;
            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
            Vector2 spriteSize = renderer.sprite.bounds.size;
            go.transform.localScale = new Vector3(size.x / spriteSize.x, size.y / spriteSize.y, 1f);
            BoxCollider2D collider = go.AddComponent<BoxCollider2D>();
            collider.size = renderer.sprite.bounds.size;
            return go;
        }

        private static Sprite GetWhitePixel()
        {
            if (whitePixel) return whitePixel;

            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();
            whitePixel = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
            return whitePixel;
        }

        private static void CreateCamera(Transform player)
        {
            Camera camera = Camera.main;
            if (!camera)
            {
                GameObject cameraObject = new GameObject("Main Camera");
                camera = cameraObject.AddComponent<Camera>();
                camera.tag = "MainCamera";
            }

            camera.orthographic = true;
            camera.orthographicSize = 4.6f;
            camera.backgroundColor = new Color(0.08f, 0.1f, 0.16f);
            camera.transform.position = new Vector3(2f, 2f, -10f);
            CameraFollow2D follow = camera.GetComponent<CameraFollow2D>() ?? camera.gameObject.AddComponent<CameraFollow2D>();
            follow.SetTarget(player);
            follow.Configure(new Vector2(0.75f, 1.25f), 1.45f, 0.14f, new Vector2(-0.8f, 1.1f), new Vector2(40.5f, 4.45f));
            follow.PlayIntro(new Vector3(-0.8f, 3.45f, -10f), 1.25f);
        }

        private static void CreateHud(GameObject player)
        {
            GameObject hud = new GameObject("Game HUD");
            hud.AddComponent<GameHud>().Bind(player);
        }

        private static void EnsureLayers()
        {
            Debug.Log("Si Unity avisa que faltan layers, crea: Ground, Enemy, Interactable.");
        }

        private static void SetLayerIfExists(GameObject target, string layerName)
        {
            int layer = LayerMask.NameToLayer(layerName);
            if (layer >= 0) target.layer = layer;
        }

        private static void IgnorePlayerBodyCollision(GameObject enemy)
        {
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (!player) return;

            Collider2D playerCollider = player.GetComponent<Collider2D>();
            Collider2D enemyCollider = enemy.GetComponent<Collider2D>();
            if (playerCollider && enemyCollider)
            {
                Physics2D.IgnoreCollision(playerCollider, enemyCollider, true);
            }
        }
    }
}
