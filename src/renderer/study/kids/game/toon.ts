// Vật liệu hoạt hình (cel/toon) dùng chung cho bản đồ 3D: ba bậc sáng rõ ràng thay vì đổ bóng mượt — cùng viền mực hậu kỳ
// cho cảm giác tranh vẽ tay. docs/19-kids-world.md §5.2
import type * as ThreeNS from 'three'

type Three = typeof ThreeNS

const gradients = new WeakMap<object, ThreeNS.DataTexture>()

function gradientMap(THREE: Three): ThreeNS.DataTexture {
  let tex = gradients.get(THREE)
  if (!tex) {
    // bóng tối nhẹ → vùng giữa → sáng; không đen hẳn để màu vẫn tươi
    const steps = [120, 175, 225, 255]
    const data = new Uint8Array(steps.length * 4)
    steps.forEach((v, i) => data.set([v, v, v, 255], i * 4))
    tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
    tex.minFilter = THREE.NearestFilter
    tex.magFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    tex.needsUpdate = true
    gradients.set(THREE, tex)
  }
  return tex
}

export function toon(
  THREE: Three,
  params: ThreeNS.MeshToonMaterialParameters = {}
): ThreeNS.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ gradientMap: gradientMap(THREE), ...params })
}
