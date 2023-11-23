import worldJson from '@/assets/world.geo.json';
import { useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Tooltip, TooltipRefProps } from 'react-tooltip';

interface HabitatMapProps {
  countries: string[];
  mapWidth?: number;
  mapHeight?: number;
}

export default function HabitatMap({
  countries,
  mapWidth = 800,
  mapHeight = 600,
}: HabitatMapProps) {
  const tooltipRef = useRef<TooltipRefProps>(null);

  return (
    <>
      <Tooltip ref={tooltipRef} />
      <ComposableMap
        className="h-full w-full"
        projectionConfig={{
          scale: 140,
        }}
        width={mapWidth}
        height={mapHeight}
      >
        <ZoomableGroup zoom={1} onMoveStart={() => tooltipRef.current?.close()}>
          <Geographies geography={worldJson}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const { fips_10 } = geo.properties;

                return (
                  <>
                    <Geography
                      key={geo.rsmKey}
                      stroke="#FFF"
                      strokeWidth={0.5}
                      filter="drop-shadow(0px 0px 1px rgb(0 0 0 / 0.2))"
                      geography={geo}
                      fill={countries.includes(fips_10) ? '#F53' : 'var(--tw-gradient-to)'}
                      className={`to-gray-400 outline-none hover:outline-none focus:outline-none active:outline-none dark:to-gray-300
                    ${
                      countries.includes(fips_10) ? 'hover:fill-rose-400' : 'hover:fill-slate-100'
                    }`}
                      onMouseEnter={() =>
                        tooltipRef.current?.open({
                          content: geo.properties.name,
                          anchorSelect: `.geo-marker-${geo.rsmKey}`,
                        })
                      }
                      onMouseLeave={() => tooltipRef.current?.close()}
                    />
                    <Marker
                      key={geo.properties.name}
                      coordinates={[geo.properties.label_x, geo.properties.label_y]}
                    >
                      <a className={`geo-marker-${geo.rsmKey}`} />
                    </Marker>
                  </>
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </>
  );
}
