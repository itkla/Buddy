import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow } from 'lucide-react';

type WeatherProps = {
    temperature: number;
    weather: string;
    location: string;
}

export const Weather = ({ temperature, weather, location }: WeatherProps) => {
    return (
        <div className="flex flex-col items-center justify-center">
            <div>
                <Sun />
                <h2 className="text-2xl font-bold">{location}</h2>
                <p className="text-4xl font-bold">{temperature}°F</p>
                {/* <p className="text-2xl font-bold">{weather}</p> */}
            </div>
        </div>
    )
}