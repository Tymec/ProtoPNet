import { timer } from 'd3';
import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Graticule } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';

// TODO: Optimize map rendering

interface HabitatMapProps {
  countries: string[];
  mapWidth?: number;
  mapHeight?: number;
  graticule?: boolean;
}

export default function HabitatMap({
  countries,
  mapWidth = 800,
  mapHeight = 600,
  graticule = false,
}: HabitatMapProps) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [yaw, setYaw] = useState(0);

  useEffect(() => {
    const t = timer(() => {
      setYaw((y) => y + 0.2);
    });

    return () => t.stop();
  }, []);

  return (
    <>
      <Tooltip
        id="map-tooltip"
        place="bottom"
        float={true}
        noArrow={false}
        content={tooltipContent}
        className="text-xs"
      />
      <ComposableMap
        data-tooltip-id="map-tooltip"
        className="h-full w-full cursor-crosshair outline-none"
        projection="geoOrthographic"
        projectionConfig={{
          rotate: [-yaw, 0, 0],
          scale: 280,
        }}
        width={mapWidth}
        height={mapHeight}
      >
        {graticule && <Graticule stroke="#999" clipPath="url(#rsm-sphere)" />}
        {/* <ZoomableGroup zoom={1} center={[0, 0]} onMoveStart={() => setTooltipContent('')}> */}
        <Geographies geography={import.meta.env.VITE_HABITAT_GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const { fips_10 } = geo.properties;

              return (
                <Geography
                  key={geo.rsmKey}
                  stroke="#FFF"
                  strokeWidth={0.5}
                  filter="drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5))"
                  geography={geo}
                  fill={countries.includes(fips_10) ? '#F53' : 'var(--tw-gradient-to)'}
                  className={`to-gray-400 outline-none hover:outline-none focus:outline-none active:outline-none dark:to-gray-300
                    ${
                      countries.includes(fips_10) ? 'hover:fill-rose-400' : 'hover:fill-slate-100'
                    }`}
                  onMouseEnter={() => setTooltipContent(geo.properties.name)}
                  onMouseLeave={() => setTooltipContent('')}
                />
              );
            })
          }
        </Geographies>
        {/* </ZoomableGroup> */}
      </ComposableMap>
    </>
  );
}
