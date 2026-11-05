// Nhóm từ cho game Phân loại của bé: mỗi hình thuộc tối đa một nhóm; hình không thuộc nhóm nào (màu, số, hình khối...)
// không dùng cho game này. Thuần dữ liệu để test ở Node.
export const PICTURE_GROUP_IDS = ['animal', 'food', 'vehicle', 'clothes', 'body'] as const
export type PictureGroupId = (typeof PICTURE_GROUP_IDS)[number]

export interface PictureGroup {
  id: PictureGroupId
  en: string
  vi: string
  /** Hình đại diện hiện trên ô nhóm */
  pictureId: string
  members: readonly string[]
}

const words = (s: string): string[] => s.split(/\s+/).filter(Boolean)

export const PICTURE_GROUPS: readonly PictureGroup[] = [
  {
    id: 'animal',
    en: 'Animals',
    vi: 'Con vật',
    pictureId: 'dog',
    members:
      words(`dog cat fish bird horse cow pig elephant rabbit monkey duck frog bear fox zebra lion tiger
      giraffe snake turtle butterfly bee owl penguin sheep chicken mouse deer dolphin whale shark octopus crab
      snail ant kangaroo panda koala camel wolf goat swan llama bat squirrel hedgehog parrot eagle flamingo seal
      jellyfish starfish seahorse ladybug spider worm hippo rhino crocodile`)
  },
  {
    id: 'food',
    en: 'Food',
    vi: 'Đồ ăn',
    pictureId: 'apple',
    members:
      words(`apple banana orange grapes strawberry watermelon pineapple peach lemon mango bread rice egg
      noodles pizza hamburger cheese icecream jam carrot tomato potato corn cherry pear coconut kiwi avocado
      broccoli mushroom cucumber onion garlic sandwich hotdog cookie donut candy chocolate popcorn pancake soup
      sushi honey fries salad dragonfruit lychee papaya durian pho springroll pasta sausage lollipop yogurt
      peanut pumpkin cabbage bean cake`)
  },
  {
    id: 'vehicle',
    en: 'Vehicles',
    vi: 'Xe cộ',
    pictureId: 'car',
    members:
      words(`car van motorbike bicycle bus train airplane boat rocket truck taxi ship helicopter ambulance
      firetruck tractor`)
  },
  {
    id: 'clothes',
    en: 'Clothes',
    vi: 'Quần áo',
    pictureId: 'tshirt',
    members: words(
      `shoe hat tshirt dress socks jacket pants skirt boots scarf gloves pajamas raincoat`
    )
  },
  {
    id: 'body',
    en: 'Body',
    vi: 'Cơ thể',
    pictureId: 'hand',
    members: words(
      `head eye ear nose mouth hand foot leg arm hair tooth finger face tongue knee belly`
    )
  }
]

const GROUP_OF = new Map<string, PictureGroupId>(
  PICTURE_GROUPS.flatMap((g) => g.members.map((m) => [m, g.id] as const))
)

export const groupOf = (pictureId: string): PictureGroupId | undefined => GROUP_OF.get(pictureId)
export const groupById = (id: PictureGroupId): PictureGroup =>
  PICTURE_GROUPS.find((g) => g.id === id) as PictureGroup
