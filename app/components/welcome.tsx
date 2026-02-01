import { Frame } from "./Frame";
import { useNavigate } from "react-router";
import { Button } from "./Button";
import React from 'react';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <Frame className="w-[90vw] bg-gray-600">
      <Frame className="gap-2 m-5">
        <Button onClick={(() => navigate('setup'))}>Import graph6</Button>
        <Button onClick={(() => navigate('edit/H4sIAAAAAAAAE6tWSkzJ8sksLlGyio7VUUrOLyiGsIryk5JSi6CcvPyUVCizuCSxqETJqrq2FgDhOFNPOwAAAA'))}>Empty graph</Button>
        <Button onClick={(() => navigate('edit/H4sIAAAAAAAAE3WRTW7jMAxG76I1IfDjj0j5DHMDw4t20kW7aIokiykC331gj4vGNWYl6SMenyjdy9Pp7dfr9VaGcQQZCelE47Iy-URjIycQrymTUKMgm2gEOTEF5VoRMmoESurryQlMnZRiolGXEpNRTjQ6dbI1dsolbhONfWk7TVR-nz-uZRgnKpfz8_PLZTu8n08v2_Z6e7rcynCfqXycl-xeXk9lKFy24F7-lEGb1s5NnMpnGQRS3a1l-DzTBmAHSKJGZygQreMLZKvMgDpLF32gZa9Df9QFjjrdAaY7gP0I2N4gWVM8VVKMs6OtJBQ1oQ3SgeiG-G7guwbovDPq0dh-GK0GMiQyxf3LqIbqnTU7LBCtPRhj18AhD0b0OBrzh7HV7CHagDTbQPOKzOYBay089Rvv-wk5aga7pbqkqOo26v-fCHz8RlgHM4uzwf7dAFGh5qHpocp9nqf5L_vqFXU5AwAA'))}>H(11)</Button>
        <Button onClick={() => navigate('edit/H4sIAAAAAAAAEzWKOQ6AMAwE_-J6Cwzhyhv4geWCq4CCoCQd4u-IEIrRzEp70bjswxYiWZESrJACFUxyg1ohjA5tcg8uFO-NweVXBlwp5Mdk6kyTUNDszkBWFOTdNK0-j8Mta84QRx_JXvf9ADFLXemVAAAA')}>Tree level 3</Button>
      </Frame>
      <Frame className="gap-2 m-5">
        <h3 className="text-3xl">Welcome!</h3>
        <p>This webapp is a work in progress, if you run into any problems, check out the <a href="https://github.com/brontybuutveld/drunkcops">Github</a></p>
      </Frame>
    </Frame>
  );
}
