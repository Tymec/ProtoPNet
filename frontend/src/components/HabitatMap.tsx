import { timer } from 'd3';
import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Graticule, ZoomableGroup } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';

interface HabitatMapProps {
  countries: string[];
  mapWidth?: number;
  mapHeight?: number;
  graticule?: boolean;
  globe?: boolean;
}

function MapWrapper({
  isGlobe,
  children,
  width,
  height,
}: {
  isGlobe: boolean;
  children: React.ReactNode;
  width: number;
  height: number;
}) {
  return isGlobe ? (
    <>{children}</>
  ) : (
    <ZoomableGroup
      zoom={1}
      center={[0, 0]}
      translateExtent={[
        [-width / 2, -height / 2],
        [2 * width, height],
      ]}
    >
      {children}
    </ZoomableGroup>
  );
}

export default function HabitatMap({
  countries,
  mapWidth = 800,
  mapHeight = 600,
  graticule = false,
  globe = false,
}: HabitatMapProps) {
  const [tooltipContent, setTooltipContent] = useState('');
  const [yaw, setYaw] = useState(0);

  useEffect(() => {
    if (!globe) return;

    const t = timer(() => {
      setYaw((y) => y + 0.2);
    });

    return () => t.stop();
  }, [globe]);

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
        projection={globe ? 'geoOrthographic' : 'geoEqualEarth'}
        projectionConfig={{
          rotate: [-yaw, 0, 0],
          scale: 280,
        }}
        width={mapWidth}
        height={mapHeight}
      >
        {graticule && <Graticule stroke="#999" clipPath="url(#rsm-sphere)" />}
        <MapWrapper isGlobe={globe} width={mapWidth} height={mapHeight}>
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
        </MapWrapper>
      </ComposableMap>
    </>
  );
}
