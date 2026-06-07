using System.Collections.Generic;
using UnityEngine;

namespace DungeonKnight
{
    public static class PixelSpriteFactory
    {
        private const int PixelsPerUnit = 16;
        private static readonly Dictionary<string, Sprite> Cache = new();

        public static Sprite Knight()
        {
            return Create("Knight", new[]
            {
                ".....HHHH.....",
                "....HSSSSH....",
                "....SFFFFS.K..",
                "...SFFEEFFSKK..",
                "...SFFFFFFSK...",
                "....SMMMMSK...",
                "...MBBBBBBMK...",
                "..MBBCCCCBBMK..",
                ".MBBCCCCBBMKK..",
                "..MBBCCBBM..K..",
                "....MBBBBM.....",
                "....B.BB.B.....",
                "...BB.BB.BB....",
                "...BB....BB....",
                "..DD......DD..."
            }, new Dictionary<char, Color>
            {
                ['H'] = Hex("2d2636"),
                ['S'] = Hex("cbd7e3"),
                ['F'] = Hex("f0c7a4"),
                ['E'] = Hex("111827"),
                ['M'] = Hex("5d6f89"),
                ['B'] = Hex("1ec8d8"),
                ['C'] = Hex("f2f7ff"),
                ['D'] = Hex("1b2430"),
                ['K'] = Hex("e9f5ff")
            });
        }

        public static Sprite Skeleton()
        {
            return Create("Skeleton", new[]
            {
                "...GGGG...",
                "..GBBBBG..",
                ".GBE..EBG.",
                ".GBBBBBBG.",
                "..G....G..",
                "...GSSG...",
                "..GSSSSG..",
                ".GSSDDSSG.",
                "..GSSSSG..",
                "...G..G...",
                "..GG..GG..",
                ".GG....GG."
            }, new Dictionary<char, Color>
            {
                ['G'] = Hex("d9d3ac"),
                ['B'] = Hex("efe9c8"),
                ['E'] = Hex("27222f"),
                ['S'] = Hex("b8ac7b"),
                ['D'] = Hex("77543d")
            });
        }

        public static Sprite Chest()
        {
            return Create("IronboundChest", new[]
            {
                "...KKKKKKKKKK...",
                "..KYYYYYYYYYYK..",
                ".KYOYOYOYOYOYK.",
                "KYYYYYYYYYYYYYK",
                "KBBBBBBBBBBBBBK",
                "KBDBBDBLDBBDBBK",
                "KBBBBBBBBBBBBBK",
                "KBOBOBOBOBOBOBK",
                ".KKKKKKKKKKKKK."
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("100c0a"),
                ['O'] = Hex("6b3f18"),
                ['Y'] = Hex("d99b36"),
                ['B'] = Hex("7f4b23"),
                ['D'] = Hex("352014"),
                ['L'] = Hex("fff0a3")
            });
        }

        public static Sprite Crate()
        {
            return Create("BreakableCrate", new[]
            {
                "KKKKKKKKKK",
                "KBBRBBRBBK",
                "KBRRBRRBBK",
                "KBBRRBBRBK",
                "KRRBBRRBBK",
                "KBBRBBRRBK",
                "KBRRBBRBBK",
                "KKKKKKKKKK"
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("1a1009"),
                ['B'] = Hex("8b5a2c"),
                ['R'] = Hex("5e351d")
            });
        }

        public static Sprite Bonfire()
        {
            return Create("Bonfire", new[]
            {
                "....Y....",
                "...YYY...",
                "..YRRRY..",
                "...RRR...",
                "..RRORR..",
                ".OOODOOO.",
                "DDD...DDD",
                ".DDD.DDD."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd45a"),
                ['R'] = Hex("ff5b1a"),
                ['O'] = Hex("6b3f18"),
                ['D'] = Hex("33251d")
            });
        }

        public static Sprite LoreTablet()
        {
            return Create("LoreTablet", new[]
            {
                "..AAAA..",
                ".ACCCCA.",
                ".CBBBBAC",
                ".CBLLBAC",
                ".CBLLBAC",
                ".CBBBBAC",
                ".ACCCCA.",
                "..AAAA.."
            }, new Dictionary<char, Color>
            {
                ['A'] = Hex("2b5165"),
                ['B'] = Hex("95d5ff"),
                ['C'] = Hex("5fa5d8"),
                ['L'] = Hex("ffffff")
            });
        }

        public static Sprite Torch()
        {
            return Create("Torch", new[]
            {
                "...Y...",
                "..YYY..",
                ".YRRRY.",
                "..ROR..",
                "...B...",
                "...B...",
                "..BBB..",
                ".B...B."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd86b"),
                ['R'] = Hex("ff6b1a"),
                ['O'] = Hex("8f2e12"),
                ['B'] = Hex("3d2f27")
            });
        }

        public static Sprite WallTorch()
        {
            return Create("WallTorch", new[]
            {
                "..........Y..........",
                ".........YYY.........",
                "........YHHY.........",
                ".......YHHHO.........",
                ".......OHHHR.........",
                "........ORR..........",
                ".........D...........",
                "...MSMM...D..........",
                "..MSSSSM..D..........",
                ".MSDSSDSM.D..........",
                ".MSDDDDSMDDM.........",
                ".MSDSSDSM.MDD........",
                ".MSDSSDSM...DD.......",
                ".MSDSSDSM....D.......",
                ".MSDDDDSM............",
                ".MSSSSSSM............",
                "..MSSSSM.............",
                "...MMMM.............."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd96b"),
                ['H'] = Hex("fff1a6"),
                ['O'] = Hex("ff7a1f"),
                ['R'] = Hex("d13a16"),
                ['M'] = Hex("171923"),
                ['S'] = Hex("5b5360"),
                ['D'] = Hex("2b2020")
            });
        }

        public static Sprite WallTorchBase()
        {
            return Create("WallTorchBase", new[]
            {
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".........D...........",
                "...MSMM...D..........",
                "..MSSSSM..D..........",
                ".MSDSSDSM.D..........",
                ".MSDDDDSMDDM.........",
                ".MSDSSDSM.MDD........",
                ".MSDSSDSM...DD.......",
                ".MSDSSDSM....D.......",
                ".MSDDDDSM............",
                ".MSSSSSSM............",
                "..MSSSSM.............",
                "...MMMM.............."
            }, new Dictionary<char, Color>
            {
                ['M'] = Hex("171923"),
                ['S'] = Hex("5b5360"),
                ['D'] = Hex("2b2020")
            });
        }

        public static Sprite WallTorchFlame()
        {
            return Create("WallTorchFlame", new[]
            {
                "..........Y..........",
                ".........YYY.........",
                "........YHHY.........",
                ".......YHHHO.........",
                ".......OHHHR.........",
                "........ORR..........",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                ".....................",
                "....................."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd96b"),
                ['H'] = Hex("fff1a6"),
                ['O'] = Hex("ff7a1f"),
                ['R'] = Hex("d13a16")
            });
        }

        public static Sprite FloorBrazier()
        {
            return Create("FloorBrazier", new[]
            {
                ".........Y.........",
                "........YYY........",
                ".......YHHHY.......",
                "......YHHHHO.......",
                "......OHHHRR.......",
                ".......ORRR........",
                "........D..........",
                "...MMMMMMMMMMM.....",
                "..MSSMSMSMSMSSM....",
                "..MSDSSDSDSSDMM....",
                "..MSSMSMSMSMSSM....",
                "...MMMMMMMMMMM.....",
                ".....MSSSSSM.......",
                ".....MSSMSSM.......",
                "......MSMMS........",
                "......MSMMS........",
                "......MSMMS........",
                ".....MMSMMSM.......",
                ".....MSSMSSM.......",
                ".....MSSMSSM.......",
                "....MSSMMMSSM......",
                "...MSSM...MSSM.....",
                "..MSSM.....MSSM....",
                ".MMMM.......MMMM..."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd96b"),
                ['H'] = Hex("fff1a6"),
                ['O'] = Hex("ff7a1f"),
                ['R'] = Hex("d13a16"),
                ['M'] = Hex("151820"),
                ['S'] = Hex("5d5964"),
                ['D'] = Hex("302225")
            });
        }

        public static Sprite FloorBrazierBase()
        {
            return Create("FloorBrazierBase", new[]
            {
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "........D..........",
                "...MMMMMMMMMMM.....",
                "..MSSMSMSMSMSSM....",
                "..MSDSSDSDSSDMM....",
                "..MSSMSMSMSMSSM....",
                "...MMMMMMMMMMM.....",
                ".....MSSSSSM.......",
                ".....MSSMSSM.......",
                "......MSMMS........",
                "......MSMMS........",
                "......MSMMS........",
                ".....MMSMMSM.......",
                ".....MSSMSSM.......",
                ".....MSSMSSM.......",
                "....MSSMMMSSM......",
                "...MSSM...MSSM.....",
                "..MSSM.....MSSM....",
                ".MMMM.......MMMM..."
            }, new Dictionary<char, Color>
            {
                ['M'] = Hex("151820"),
                ['S'] = Hex("5d5964"),
                ['D'] = Hex("302225")
            });
        }

        public static Sprite FloorBrazierFlame()
        {
            return Create("FloorBrazierFlame", new[]
            {
                ".........Y.........",
                "........YYY........",
                ".......YHHHY.......",
                "......YHHHHO.......",
                "......OHHHRR.......",
                ".......ORRR........",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "...................",
                "..................."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd96b"),
                ['H'] = Hex("fff1a6"),
                ['O'] = Hex("ff7a1f"),
                ['R'] = Hex("d13a16")
            });
        }

        public static Sprite FireTrapBase()
        {
            return Create("FireTrapBase", new[]
            {
                ".....KKKKKKKKKKKKKKKKKKKKKKK.....",
                "...KKSSSSSSSSSSSSSSSSSSSSSSSKK...",
                "..KSSDDDDDDDDDDDDDDDDDDDDDDDSSK..",
                ".KSDDDKKKKDDDDKKKKKDDDDKKKKDDSK.",
                "KSDDDKRRRKDDDKRHHHRKDDDKRRRKDDSK",
                "KSDDDKRRRKDDDKRHHHRKDDDKRRRKDDSK",
                "KSDDDKKKKDDDDKKKKKDDDDKKKKDDSK.",
                "KSDDDDDDDDDDDDDDDDDDDDDDDDDDDSK",
                "KSDDSSSSSSSSSSSSSSSSSSSSSSSDDSK",
                ".KSDDKKDDKDDKDDKDDKDDKDDKKDDSK.",
                "..KSSDDDDDDDDDDDDDDDDDDDDDSSK..",
                "...KKSSSSSSSSSSSSSSSSSSSSSKK...",
                "KSSKKKKKKKKKKKKKKKKKKKKKKKKKSSK",
                "KSDDSSDDSSDDSSDDSSDDSSDDSSDDDSK",
                ".KSDDDDDDDDDDDDDDDDDDDDDDDDDSK.",
                "..KKSSSSSSSSSSSSSSSSSSSSSSKK..",
                "....KKKKKKKKKKKKKKKKKKKKKKK...."
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("07080a"),
                ['S'] = Hex("525a5e"),
                ['D'] = Hex("202329"),
                ['R'] = Hex("8c3518"),
                ['H'] = Hex("ff8c1a")
            });
        }

        public static Sprite FireTrapFlame()
        {
            return Create("FireTrapFlame", new[]
            {
                "..............D..........",
                ".............DDD.........",
                "............D.RD.........",
                "...........D.RRD.........",
                "..........D.RORD.........",
                ".........D.ROORD.........",
                "........D.ROOYRD.........",
                ".......D.ROOYYRD.........",
                "......D.ROOYYYRD.........",
                "......DROOYYHYRD.........",
                ".....DROOYYHHYRD.........",
                "....DROOYYHHHYRD.........",
                "...DROOYYHHHHYRD.........",
                "...DROYYHHHHYYRD.........",
                "..DROYYHHHHHYYRD.........",
                "..DROYYHHHHHYYORD........",
                ".DROYYHHHHHHYYORD........",
                ".DROYYHHHHHHYYOORD.......",
                ".DROYYHHHHHHHYYOORD......",
                ".DROYYHHHHHHHYYOORD......",
                "..DROYYHHHHHHYYOOORD.....",
                "..DROOYYHHHHYYOOOORD.....",
                "...DROOYYYYYYOOOOORD.....",
                "...DROOOYYYYOOOOOORD.....",
                "....DROOOOOOOOOOORD......",
                ".....DROOOOOOOOORD.......",
                "......DROOOOOOORD........",
                ".......DROOOOORD.........",
                "........DROOORD..........",
                ".........DRRRD...........",
                "..........DDD............"
            }, new Dictionary<char, Color>
            {
                ['D'] = Hex("1d1712"),
                ['R'] = Hex("d93512"),
                ['O'] = Hex("ff7316"),
                ['Y'] = Hex("ffbd28"),
                ['H'] = Hex("fff1a6")
            });
        }

        public static Sprite FireTrapSmoke()
        {
            return Create("FireTrapSmoke", new[]
            {
                ".......S........",
                "......SSS.......",
                "....S.SSS.......",
                "...SSSSS........",
                "..SSSS..........",
                "...SSSS.S.......",
                ".....SSSS.......",
                "......SS........"
            }, new Dictionary<char, Color>
            {
                ['S'] = new Color(0.12f, 0.11f, 0.1f, 0.55f)
            });
        }

        public static Sprite ExitDoor()
        {
            return Create("GothicExitDoor", new[]
            {
                ".....AAAAA.....",
                "...AACCCCCAA...",
                "..ACBBBBBBBCA..",
                ".ACBDBBDBBBCA.",
                ".CBBDDBBDDBBC.",
                ".CBBDBLDBBBBC.",
                ".CBBDDBBDDBBC.",
                ".CBBDBBDBBBBC.",
                ".CBBDDBBDDBBC.",
                ".CBBBBBBBBBBC.",
                ".CDDDDDDDDDDC.",
                "..CCCCCCCCC..",
                "...AAAAAAAA..."
            }, new Dictionary<char, Color>
            {
                ['A'] = Hex("75604c"),
                ['B'] = Hex("2b2433"),
                ['C'] = Hex("9b7a55"),
                ['D'] = Hex("17131f"),
                ['L'] = Hex("ffd86b")
            });
        }

        public static Sprite Spikes()
        {
            return Create("RustySpikeRow", new[]
            {
                "....K......K......K......K......K....",
                "...KHK....KHK....KHK....KHK....KHK...",
                "...KSK....KRK....KSK....KRK....KSK...",
                "..KSDK...KRDK...KSDK...KRDK...KSDK..",
                "..KSDK...KRDK...KSDK...KRDK...KSDK..",
                ".KSDDK..KRDDK..KSDDK..KRDDK..KSDDK.",
                ".KSDDK..KRDDK..KSDDK..KRDDK..KSDDK.",
                "KSDRDK.KRDDDK.KSDRDK.KRDDDK.KSDRDK",
                "KSDDDK.KRDDDK.KSDDDK.KRDDDK.KSDDDK",
                "KDDDDKKRDDDDKKDDDDKKRDDDDKKDDDDK",
                "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
                "KBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK",
                "KBDDDDBBDDDDBBDDDDBBDDDDBBDDDDBK",
                "KBDRDBBDRDDBBDRDBBBDRDDBBDRDBBK",
                "KBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK",
                "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK"
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("08080a"),
                ['H'] = Hex("d9c5a2"),
                ['S'] = Hex("8d9290"),
                ['R'] = Hex("8a4a26"),
                ['D'] = Hex("34302b"),
                ['B'] = Hex("1c1818")
            });
        }

        public static Sprite HangingAxeBlade()
        {
            return Create("HangingAxeBlade", new[]
            {
                "....................KKKK....",
                ".................KKKSSSSK...",
                "..............KKKSSSDDDSK...",
                "...........KKKSSDDDDDRSK....",
                "........KKKSSDDDRRDDDK......",
                ".....KKKSSDDRRDDDDDDK.......",
                "...KKSSDDDDDDDDDDDK.........",
                "..KSSDDDDDDDDDDDK...........",
                ".KSSDDDDDDDDDDK.............",
                "KSSDDDDDDDDDDK..............",
                "KSDDDDDDDDDDHK..............",
                ".KSSDDDDDDDDHKKK............",
                "..KSSDDDDDDDDSSKK...........",
                "...KKSSDDDDDDDDSSK..........",
                ".....KKSSDDDDDDDSK..........",
                ".......KKSSSSSSSK...........",
                "..........KKKKK............."
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("08080a"),
                ['S'] = Hex("9ca2a1"),
                ['D'] = Hex("2f3134"),
                ['R'] = Hex("6e3a24"),
                ['H'] = Hex("d7d2c5")
            });
        }

        public static Sprite ChainLink()
        {
            return Create("ChainLink", new[]
            {
                ".KKK.",
                "KSSSK",
                "KS.SK",
                "KS.SK",
                "KSSSK",
                ".KKK."
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("08080a"),
                ['S'] = Hex("6f7175")
            });
        }

        public static Sprite Coin()
        {
            return Create("Coin", new[]
            {
                "..YY..",
                ".YOOY.",
                "YOYYOY",
                "YOYYOY",
                ".YOOY.",
                "..YY.."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd76a"),
                ['O'] = Hex("c98724")
            });
        }

        public static Sprite GateKey()
        {
            return Create("GateKey", new[]
            {
                "....YY....",
                "...YOOY...",
                "...YOOY...",
                "....YY....",
                "....Y.....",
                "....Y.....",
                "....YYYY..",
                "....Y..Y..",
                "....Y..Y.."
            }, new Dictionary<char, Color>
            {
                ['Y'] = Hex("ffd76a"),
                ['O'] = Hex("8f5f1f")
            });
        }

        public static Sprite Bat()
        {
            return Create("ChasingBat", new[]
            {
                "K.............K",
                "KK...........KK",
                "KDK.........KDK",
                "KDDK.......KDDK",
                ".KDDK.KKK.KDDK.",
                "..KDDKBBBKDDK..",
                "...KDBEBEBDK...",
                "....KBBBBBK....",
                ".....KBBBK.....",
                "......K.K......"
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("09090d"),
                ['D'] = Hex("3b4050"),
                ['B'] = Hex("747b91"),
                ['E'] = Hex("ffe36a")
            });
        }

        public static Sprite KnightShield()
        {
            return Create("KnightShield", new[]
            {
                "..KKKKK..",
                ".KSSSSSK.",
                "KSDDDDSK",
                "KSDYYDSK",
                "KSDYYDSK",
                "KSDDDDSK",
                ".KSDDSK.",
                "..KSSK..",
                "...KK..."
            }, new Dictionary<char, Color>
            {
                ['K'] = Hex("09090b"),
                ['S'] = Hex("8e959b"),
                ['D'] = Hex("262b33"),
                ['Y'] = Hex("d9a63a")
            });
        }

        public static Sprite Stone()
        {
            return Create("Stone", new[]
            {
                "AABBAABBAABB",
                "BCCBCCBCCBCC",
                "BCCCCCCCCCCB",
                "AABBAABBAABB"
            }, new Dictionary<char, Color>
            {
                ['A'] = Hex("2b2634"),
                ['B'] = Hex("453d52"),
                ['C'] = Hex("342f40")
            });
        }

        public static Sprite Create(string name, string[] rows, Dictionary<char, Color> palette)
        {
            if (Cache.TryGetValue(name, out Sprite cached)) return cached;

            int width = 0;
            foreach (string row in rows)
            {
                width = Mathf.Max(width, row.Length);
            }

            int height = rows.Length;
            Texture2D texture = new Texture2D(width, height, TextureFormat.RGBA32, false)
            {
                filterMode = FilterMode.Point,
                wrapMode = TextureWrapMode.Clamp
            };

            for (int y = 0; y < height; y++)
            {
                string row = rows[height - 1 - y];
                for (int x = 0; x < width; x++)
                {
                    char key = x < row.Length ? row[x] : '.';
                    texture.SetPixel(x, y, key == '.' || !palette.TryGetValue(key, out Color color) ? Color.clear : color);
                }
            }

            texture.Apply();
            Sprite sprite = Sprite.Create(texture, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f), PixelsPerUnit);
            sprite.name = name;
            Cache[name] = sprite;
            return sprite;
        }

        private static Color Hex(string value)
        {
            ColorUtility.TryParseHtmlString("#" + value, out Color color);
            return color;
        }
    }
}
