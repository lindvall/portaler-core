import React, { FC, useState, useRef, createRef, useEffect } from 'react'
import clone from 'lodash/cloneDeep'
import { closest, distance } from 'fastest-levenshtein'
// import detectImage from 'react-shape-detect'  // Should perhaps be used?
import ReactDOM from 'react-dom'
import { Checkbox } from '@material-ui/core'

import { DEFAULT_ZONE } from '../common/data/constants'
import useZoneListSelector from '../common/hooks/useZoneListSelector'
import { PortalSize, Zone } from '@portaler/types'
import { InputError } from '../types'
import { time } from 'console'
// import useAddPortal from './useAddPortal'
import styles from './styles.module.scss'

const displayMediaOptions: Object = {
  video: {
    cursor: 'always',
  },
  audio: false,
}

let textDetect: any

try {
  // @ts-ignore
  textDetect = new TextDetector()
} catch {
  // console.log('Experimental Web Platform Features disabled or not available')
}

// console.log(textDetect)

const portalSizeValid = (size: PortalSize | null) =>
  size !== null && [0, 2, 7, 20].includes(size)

// const displayNames = World.map(cluster => cluster.displayname.trim());
const closesPattern = /([0-9]?[0-9])[^0-9]+([0-9]?[0-9])?/

// Find the closest match
function findMatch(color: { r: any; g: any; b: any }): 2 | 7 | 20 | 0 {
  const match = [
    { r: 139, g: 180, b: 60 },
    { r: 54, g: 155, b: 204 },
    { r: 177, g: 129, b: 19 },
  ]
  let bestDistance = -1
  let bestMatch
  for (let i = 0; i < match.length; i++) {
    const distance =
      (color.r - match[i].r) * (color.r - match[i].r) +
      (color.g - match[i].g) * (color.g - match[i].g) +
      (color.b - match[i].b) * (color.b - match[i].b)
    if (bestDistance === -1 || bestDistance > distance) {
      bestDistance = distance
      bestMatch = i
    }
  }
  switch (bestMatch) {
    case 0:
      return 2
    case 1:
      return 7
    case 2:
      return 20
    default:
      return 0
  }
}

function getColor(data: ImageData) {
  const length = data.data.length
  let i = 0
  let count = 0
  const rgb = { r: 0, g: 0, b: 0 }
  while ((i += 4) < length) {
    ++count
    rgb.r += data.data[i]
    rgb.g += data.data[i + 1]
    rgb.b += data.data[i + 2]
  }

  // ~~ used to floor values
  rgb.r = ~~(rgb.r / count)
  rgb.g = ~~(rgb.g / count)
  rgb.b = ~~(rgb.b / count)

  return rgb
}

interface AlbionCaptureProps {
  setFrom: (zone: Zone) => void
  setTo: (zone: Zone) => void
  setPortalSize: (size: PortalSize | null) => void
  setHours: (hours: number | null) => void
  setMinutes: (minutes: number | null) => void
  setErrors: (error: InputError[]) => void
}

const AlbionCapture: FC<AlbionCaptureProps> = ({
  setFrom,
  setTo,
  setPortalSize,
  setHours,
  setMinutes,
  setErrors,
}) => {
  // const oldFromId = useRef<number>(0)
  // const oldToId = useRef<number>(0)
  // const oldSize = useRef<PortalSize | null>(null)
  // const oldTime = useRef<number | null>(0)
  // const [from, setFrom] = useState<Zone>(DEFAULT_ZONE)
  // const [to, setTo] = useState<Zone>(DEFAULT_ZONE)
  // const [portalSize, setPortalSize] = useState<PortalSize | null>(null)
  // const [hours, setHours] = useState<number | null>(null)
  // const [minutes, setMinutes] = useState<number | null>(null)
  // const [errors, setErrors] = useState<InputError[]>([])
  // const [focusCounter, setFocusCounter] = useState<number>(0)

  const zones: Zone[] = useZoneListSelector()
  const displayNames = zones.map((zone) => zone.name.trim())

  // const addPortal = useAddPortal()

  const videoElem = useRef<HTMLVideoElement>(null)
  const mapElem = useRef<HTMLCanvasElement>(null)
  const zoneElem = useRef<HTMLCanvasElement>(null)
  const sizeElem = useRef<HTMLCanvasElement>(null)
  const portalElem = useRef<HTMLCanvasElement>(null)
  const portal2Elem = useRef<HTMLCanvasElement>(null)
  const expiresElem = useRef<HTMLCanvasElement>(null)
  const scaledElem = useRef<HTMLCanvasElement>(null)
  const [started, setStarted] = useState(false)
  const [road, setRoad] = useState({
    zone: '',
    portal: '',
    expires: {
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
    size: 0,
  })
  // const {updateRoad, updateLocation} = props
  const [debug, setDebug] = useState(false)

  async function startCapture() {
    try {
      if (videoElem && videoElem.current) {
        videoElem.current.srcObject =
          await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
        setStarted(true)
      }
    } catch (err) {
      console.error('Error: ' + err)
    }
  }

  useEffect(() => {
    async function loop() {
      if (videoElem.current && scaledElem.current) {
        const scaled = scaledElem.current.getContext('2d')
        const vw = videoElem.current.videoWidth
        const vh = videoElem.current.videoHeight
        const tw = vw / 3840.0
        const hratio = (2160.0 / vh) * tw
        const offset = 3840.0 * tw - (3840.0 * tw) / hratio
        // console.log(`${vw} ${vh} ${hratio} ${offset}`)
        if (scaled) {
          scaled.drawImage(
            videoElem.current,
            offset,
            0,
            vw - offset,
            vh,
            0,
            0,
            3840,
            2160
          )
        }
      }
      if (
        scaledElem.current &&
        mapElem.current &&
        videoElem.current &&
        videoElem.current.videoWidth &&
        zoneElem.current &&
        sizeElem.current &&
        portalElem.current &&
        portal2Elem.current &&
        expiresElem.current
      ) {
        let timer: {
          hours: number
          minutes: number
          seconds: number
        } = {
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
        let portal: string = ''
        let color: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
        const map = mapElem.current.getContext('2d')
        if (map && textDetect) {
          map.drawImage(
            scaledElem.current,
            2800,
            1400,
            1040,
            670,
            0,
            0,
            1040,
            670
          )
          const mapImage = map.getImageData(0, 0, 1040, 760)
          let mapBoxes = await textDetect.detect(mapImage)
          const box = mapBoxes.find((box: { rawValue: string | string[] }) =>
            box.rawValue.includes('Road of Avalon')
          )
          if (box) {
            const bb = box.boundingBox

            const portalctx = portalElem.current.getContext('2d')
            if (portalctx)
              portalctx.drawImage(
                mapElem.current,
                bb.left - 137,
                bb.top - 23,
                720,
                225,
                0,
                0,
                725,
                225
              )
            // Let's try and figure out the size
            const size = sizeElem.current.getContext('2d')
            if (size)
              size.drawImage(
                mapElem.current,
                bb.left - 70,
                bb.top + 20,
                10,
                10,
                0,
                0,
                10,
                10
              )
            if (size) color = getColor(size.getImageData(0, 0, 10, 10))
            // g {r: 139, g: 180, b: 60}
            // b {r: 54, g: 155, b: 204}
            // y {r: 177, g: 129, b: 19}

            if (portalctx)
              mapBoxes = await textDetect.detect(
                portalctx.getImageData(130, 50, 400, 50)
              )
            mapBoxes.forEach((box: { rawValue: any }) => {
              const expires = box.rawValue
              const s = closest(expires, displayNames)
              // console.log('Road: ' + s)
              portal = s
            })
            if (portalctx)
              mapBoxes = await textDetect.detect(
                portalctx.getImageData(415, 125, 725, 125)
              )
            mapBoxes.forEach((box: { rawValue: any }) => {
              const expires = box.rawValue
              const [, /* full match */ num1, num2] =
                closesPattern.exec(expires) || []
              if (
                expires.includes('h') ||
                (expires.includes('m') && !expires.includes('s'))
              ) {
                timer = {
                  hours: Number(num1),
                  minutes: num2 ? Number(num2) : 0,
                  seconds: 0,
                }
              } else if (expires.includes('s')) {
                timer = {
                  hours: 0,
                  minutes: Number(num1),
                  seconds: num2 ? Number(num2) : 0,
                }
              }
            })
          }
          // 695140
          if (zoneElem.current) {
            const zone = zoneElem.current.getContext('2d')
            if (zone)
              zone.drawImage(
                scaledElem.current,
                3330,
                2070,
                270,
                60,
                0,
                0,
                270,
                60
              )
            if (zone) {
              const zoneImage = zone.getImageData(0, 0, 270, 60)
              let currentZone: string = ''
              if (zoneImage) {
                const zoneBoxes = await textDetect.detect(zoneImage)

                zoneBoxes.forEach((box: { rawValue: string }) => {
                  // console.log('Current zone: ' + box.rawValue)
                  currentZone = closest(box.rawValue, displayNames)
                  const d = distance(box.rawValue, currentZone)
                  if (d <= 2) {
                    if (!currentZone.startsWith('Conquerors')) {
                      // console.log('Updating location: ' + currentZone)
                      // updateLocation(currentZone)
                    }
                  }
                })
              }

              const newRoad = {
                zone: currentZone,
                portal: portal,
                expires: timer,
                size: color ? findMatch(color) : 0,
              }

              if (
                newRoad.zone &&
                newRoad.portal &&
                newRoad.expires &&
                newRoad.size
              ) {
                setRoad(newRoad)
                setFrom(
                  clone(
                    zones.find((z) => z.name === currentZone) || DEFAULT_ZONE
                  )
                )

                setTo(
                  clone(
                    zones.find((z) => z.name === newRoad.portal) || DEFAULT_ZONE
                  )
                )

                setPortalSize(newRoad.size as PortalSize)
                setHours(newRoad.expires.hours)
                setMinutes(newRoad.expires.minutes)

                // console.log('Setting and updating road')
                // console.log(newRoad)

                // TODO: Make it optional to automatically add roads?
                // try {
                //   const hr = Number(hours)
                //   const min = Number(minutes)

                //   if (
                //     from?.name &&
                //     to?.name &&
                //     portalSizeValid(portalSize) &&
                //     (hr + min > 0 || portalSize === 0)
                //   ) {
                //     addPortal({
                //       connection: [from.name, to.name],
                //       size: portalSize as PortalSize,
                //       hours: hr,
                //       minutes: min,
                //     })

                //     setTo(clone(DEFAULT_ZONE))
                //     setHours(null)
                //     setMinutes(null)
                //     setPortalSize(null)

                //     setFocusCounter((x) => ++x)
                //   } else {
                //     throw new Error('you suck')
                //   }
                // } catch (err) {
                //   console.error(err)
                // }
              }
            }
          }
        }
      }
    }
    if (started) {
      const interval = setInterval(loop, 1000)
      return () => clearInterval(interval)
    }
  }, [
    started,
    scaledElem,
    mapElem,
    videoElem,
    zoneElem,
    portalElem,
    sizeElem,
    portal2Elem,
    expiresElem,
    displayNames,
    zones,
    setFrom,
    setTo,
    setPortalSize,
    setHours,
    setMinutes,
  ])

  function stopCapture() {
    if (videoElem && videoElem.current && videoElem.current.srcObject) {
      const stream = videoElem.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach((track) => track.stop())
      videoElem.current.srcObject = null
      setStarted(false)
    }
  }

  return (
    <div className={styles.row}>
      <br />
      <p>
        {textDetect ? null : (
          <span style={{ display: 'block' }}>
            You must have 'Experimental Web Platform Features' enabled to use
            this
          </span>
        )}
        {started ? (
          ''
        ) : (
          <button disabled={!textDetect} onClick={startCapture} id="start">
            Start Road Screen Capture
          </button>
        )}
        {started ? (
          <button onClick={stopCapture} id="stop">
            Stop Road Screen Capture
          </button>
        ) : (
          ''
        )}
      </p>
      {road.zone ? (
        <h3>
          Road Detected: {road.zone} {road.portal} {road.size}{' '}
          {road.expires
            ? road.expires.hours +
              'h ' +
              road.expires.minutes +
              'm' +
              road.expires.seconds +
              's'
            : ''}
        </h3>
      ) : (
        ''
      )}

      <canvas
        width={725}
        height={225}
        ref={portalElem}
        id="portal"
        className={styles.detectedPortal}
      />
      <br />
      <Checkbox
        id="updateDebugCheckbox"
        onChange={(e, v) => {
          setDebug(!debug)
        }}
        checked={debug}
      />
      <span>&nbsp;Debug&nbsp;</span>

      <div style={{ display: debug ? 'block' : 'none' }}>
        <video ref={videoElem} id="video" autoPlay />
        <br />
        <canvas width={1040} height={670} ref={mapElem} id="cropped" />
        <br />
        <canvas width={270} height={60} ref={zoneElem} id="currentzone" />
        <br />
        <canvas width={10} height={10} ref={sizeElem} />
        <br />
        <canvas width={725} height={225} ref={portal2Elem} id="portal2" />
        <br />
        <canvas width={725} height={225} ref={expiresElem} id="expires" />
        <br />
        <canvas width={3840} height={2160} ref={scaledElem} id="scaled" />
        <br />
      </div>
    </div>
  )

  // const checkPortals = useGetPortals()

  // return useCallback(
  //   async (portal: PortalPayload) => {
  //     await fetchler.post('/api/portal', { ...portal })

  //     await checkPortals(true)
  //   },
  //   [checkPortals]
  // )
}

export default AlbionCapture
