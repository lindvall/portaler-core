import './App.css'

import React, { useState } from 'react'

import { Checkbox, FormControlLabel } from '@material-ui/core'

import DataDisplay from '../DataDisplay'
import MappingBar from '../MappingBar'
import PasswordForm from '../PasswordForm'
import useGetConfig from './useGetConfig'
import useGetPortals from './useGetPortals'
import useGetZones from './useGetZones'

function App() {
  const [token, setToken] = useState<string>('')
  const [updateLayoutOnChange, setUpdateLayoutOnChange] = useState(true)

  const config = useGetConfig()
  const zones = useGetZones(token, config?.publicRead)
  const [portals, updatePortals] = useGetPortals(token, config?.publicRead)

  const [sourceZone, setSourceZone] = useState<string | null>(null)

  return (
    <div className="app-container">
      <header>
        <h1>Albion Mapper</h1>
      </header>

      <main className="layout">
        <aside className="search-side">
          {!token ? (
            <PasswordForm password={token} setPassword={setToken} />
          ) : (
            <>
              <MappingBar
                fromId={sourceZone}
                zones={zones}
                token={token}
                updatePortals={updatePortals}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updateLayoutOnChange}
                    onChange={() =>
                      setUpdateLayoutOnChange(!updateLayoutOnChange)
                    }
                    name="layout-change"
                    color="primary"
                  />
                }
                label="Update layout after create"
              />
            </>
          )}
        </aside>
        {(!!token || config?.publicRead) && (
          <div className="map-display">
            <DataDisplay
              zones={zones}
              portals={portals}
              updateLayoutOnChange={updateLayoutOnChange}
              onNodeClick={(n) => setSourceZone(n)}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
