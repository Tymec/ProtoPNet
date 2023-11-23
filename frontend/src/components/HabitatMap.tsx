import worldJson from '@/assets/world2.geo.json';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

interface HabitatMapProps {
  countries: string[];
}

export default function HabitatMap({ countries }: HabitatMapProps) {
  return (
    <ComposableMap
      className="h-full w-full"
      projectionConfig={{
        scale: 140,
      }}
      width={800}
    >
      <ZoomableGroup zoom={1}>
        <Geographies geography={worldJson}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const { fips_10 } = geo.properties;

              return (
                <Geography
                  key={geo.rsmKey}
                  stroke="#FFF"
                  strokeWidth={0.5}
                  filter="drop-shadow(0px 0px 1px rgb(0 0 0 / 0.2))"
                  geography={geo}
                  fill={countries.includes(fips_10) ? '#F53' : 'var(--tw-gradient-to)'}
                  className={`to-gray-400 outline-none hover:outline-none focus:outline-none active:outline-none dark:to-gray-300
                  ${countries.includes(fips_10) ? 'hover:fill-rose-400' : 'hover:fill-slate-100'}`}
                />
              );
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
}
