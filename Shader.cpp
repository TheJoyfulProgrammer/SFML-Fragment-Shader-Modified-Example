#include "Effect.hpp"
#include <vector>
#include <cmath>

//  GLOBAL VARIABLE REQUIRED FOR ONE OF THE SFML SHADER DEMOS
const sf::Font* Effect::s_font = NULL;
unsigned long int WindowWidth{1280};
unsigned long int WindowHeight{720};


////////////////////////////////////////////////////////////
// "Pixelate" fragment shader
////////////////////////////////////////////////////////////
class Pixelate : public Effect
{
public:

    Pixelate() :
    Effect("PIXELATE")
    {
    }

    bool onLoad()
    {
        // Load the texture and initialize the sprite
        if (!m_texture.loadFromFile("resources/background2.jpg"))
            return false;
        m_sprite.setTexture(m_texture);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/pixelate.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float, float x, float y)
    {
        m_shader.setUniform("pixel_threshold", (x + y) / 30);

        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          sf::FloatRect SpriteLBounds = m_sprite.getLocalBounds();

          m_sprite.setScale((float)(WindowWidth / SpriteLBounds.width), (float)(WindowHeight / SpriteLBounds.height));
        }

    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(m_sprite, states);
    }

private:

    sf::Texture m_texture;
    sf::Sprite m_sprite;
    sf::Shader m_shader;
};


////////////////////////////////////////////////////////////
// "Wave" vertex shader + "blur" fragment shader
////////////////////////////////////////////////////////////
class WaveBlur : public Effect
{
public:

    WaveBlur() :
    Effect("WAVE  +  BLUR")
    {
    }

    bool onLoad()
    {

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        sf::Font PTSansRegular;
        //if (!PTSansRegular.loadFromFile("resources/PTSans-Regular.ttf"))
        //    return EXIT_FAILURE;

        // Create the text
        m_text.setString("SFML Shader Test Demo\n\n"
                         "Modified by: Waltersmind (Walter Whitman) a.k.a. The Joyful Programmer\n"
                         "July 10, 2018\n\n"
                         "wwww.TheJoyfulProgrammer.com\n\n"
                         "O Captain! My Captain! rise up and hear the bells;\n"
                         "Rise up-for you the flag is flung-for you the bugle trills;\n"
                         "For you bouquets and ribbon'd wreaths-for you the shores a-crowding;\n"
                         "For you they call, the swaying mass, their eager faces turning;\n"
                         "    Here captain! dear father!\n"
                         "        This arm beneath your head;\n"
                         "            It is some dream that on the deck,\n"
                         "                You've fallen cold and dead.\n");

        m_text.setFont(getFont());
        m_text.setCharacterSize(34);
        m_text.setPosition(30, 20);

        // Load the shader
        if (!m_shader.loadFromFile("resources/wave.vert", "resources/blur.frag"))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        m_shader.setUniform("wave_phase", time);
        m_shader.setUniform("wave_amplitude", sf::Vector2f(x * 40, y * 40));
        m_shader.setUniform("blur_radius", (x + y) * 0.008f);
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(m_text, states);
    }

private:

    sf::Text m_text;
    sf::Shader m_shader;
};


////////////////////////////////////////////////////////////
// "Storm" vertex shader + "blink" fragment shader
////////////////////////////////////////////////////////////
class StormBlink : public Effect
{
public:

    StormBlink() :
    Effect("STORM  +  BLINK")
    {
    }

    bool onLoad()
    {

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Create the points
        m_points.setPrimitiveType(sf::Points);
        for (int i = 0; i < 5000000; ++i)
        {
            float x = static_cast<float>(std::rand() % WindowWidth);
            float y = static_cast<float>(std::rand() % WindowHeight);
            sf::Uint8 r = std::rand() % 255;
            sf::Uint8 g = std::rand() % 255;
            sf::Uint8 b = std::rand() % 255;
            m_points.append(sf::Vertex(sf::Vector2f(x, y), sf::Color(r, g, b)));
        }

        // Load the shader
        if (!m_shader.loadFromFile("resources/storm.vert", "resources/blink.frag"))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          //m_surface.create(WindowWidth, WindowHeight);
          //m_surface.setSmooth(true);

          for (int i = 0; i < 5000000; ++i)
          {
              float x = static_cast<float>(std::rand() % WindowWidth);
              float y = static_cast<float>(std::rand() % WindowHeight);
              //sf::Uint8 r = std::rand() % 255;
              //sf::Uint8 g = std::rand() % 255;
              //sf::Uint8 b = std::rand() % 255;
              //m_points.append(sf::Vertex(sf::Vector2f(x, y), sf::Color(r, g, b)));
              m_points[i].position = sf::Vector2f(x, y);
          }
        }

        float radius = 200 + std::cos(time) * 185;
        m_shader.setUniform("storm_position", sf::Vector2f(x * WindowWidth, y * WindowHeight));
        m_shader.setUniform("storm_inner_radius", radius / 3);
        m_shader.setUniform("storm_total_radius", radius);
        //m_shader.setUniform("blink_alpha", 0.75f + std::cos(time * 3) * 0.25f);
        m_shader.setUniform("blink_alpha", 1.0f + std::cos(time * 3) * 0.85f);
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(m_points, states);
    }

private:

    sf::VertexArray m_points;
    sf::Shader m_shader;
};


////////////////////////////////////////////////////////////
// "Edge" post-effect fragment shader
////////////////////////////////////////////////////////////
class Edge : public Effect
{
public:

    Edge() :
    Effect("EDGE  POST-EFFECT")
    {
    }

    bool onLoad()
    {
        // Create the off-screen surface
        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the textures
        if (!m_backgroundTexture.loadFromFile("resources/sfml.png"))  // 530 x 320
            return false;

        m_backgroundTexture.setSmooth(true);

        if (!m_entityTexture.loadFromFile("resources/devices.png"))
            return false;

        m_entityTexture.setSmooth(true);

        // Initialize the background sprite
        m_backgroundSprite.setTexture(m_backgroundTexture);
        //m_backgroundSprite.setPosition(375, 200);
        m_backgroundSprite.setPosition((WindowWidth / 2) - 265, (WindowHeight / 2) - 160);

        // Load the moving entities
        for (int i = 0; i < 6; ++i)
        {
            sf::Sprite entity(m_entityTexture, sf::IntRect(96 * i, 0, 96, 96));
            m_entities.push_back(entity);
        }

        // Load the shader
        if (!m_shader.loadFromFile("resources/edge.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {

        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_backgroundSprite.setPosition((WindowWidth / 2) - 265, (WindowHeight / 2) - 160);

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("edge_threshold", 1 - (x + y) / 2);

        // Update the position of the moving entities
        for (std::size_t i = 0; i < m_entities.size(); ++i)
        {
            sf::Vector2f position;
            //position.x = std::cos(0.25f * (time * i + (m_entities.size() - i))) * 300 + 590;
            //position.y = std::sin(0.25f * (time * (m_entities.size() - i) + i)) * 200 + 310;
            position.x = std::cos(0.25f * (time * i + (m_entities.size() - i))) * 300 + ((WindowWidth / 2) - 50);
            position.y = std::sin(0.25f * (time * (m_entities.size() - i) + i)) * 200 + ((WindowHeight / 2) - 50);
            m_entities[i].setPosition(position);
        }

        // Render the updated scene to the off-screen surface
        m_surface.clear(sf::Color::White);
        m_surface.draw(m_backgroundSprite);
        for (std::size_t i = 0; i < m_entities.size(); ++i)
            m_surface.draw(m_entities[i]);
        m_surface.display();
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::RenderTexture        m_surface;
    sf::Texture              m_backgroundTexture;
    sf::Texture              m_entityTexture;
    sf::Sprite               m_backgroundSprite;
    std::vector<sf::Sprite> m_entities;
    sf::Shader               m_shader;
};


////////////////////////////////////////////////////////////
// "Geometry" geometry shader example
////////////////////////////////////////////////////////////
class Geometry : public Effect
{
public:

    const size_t NumOfBillboards{100000};

    Geometry() :
        Effect("GEOMETRY  SHADER  BILLBOARDS"),
        m_pointCloud(sf::Points, NumOfBillboards)
    {
    }

    bool onLoad()
    {
        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Check if geometry shaders are supported
        if (!sf::Shader::isGeometryAvailable())
            return false;

        // Move the points in the point cloud to random positions
        for (std::size_t i = 0; i < NumOfBillboards; i++)
        {
            // Spread the coordinates from -480 to +480
            // So they'll always fill the viewport at WindowWidthx600
            //m_pointCloud[i].position.x = rand() % 1500 - 750.f; //960 - 480;
            //m_pointCloud[i].position.y = rand() % 1500 - 750.f; //960 - 480;
            //m_pointCloud[i].position.x = rand() % (WindowWidth * 2) - 750.f; //960 - 480;
            //m_pointCloud[i].position.y = rand() % (WindowWidth * 2) - 750.f; //960 - 480;
            m_pointCloud[i].position.x = rand() % (WindowWidth * 2) - (float)(WindowWidth); //960 - 480;
            m_pointCloud[i].position.y = rand() % (WindowWidth * 2) - (float)(WindowWidth); //960 - 480;
        }

        // Load the texture
        if (!m_logoTexture.loadFromFile("resources/logo.png"))
            return false;

        // Load the shader
        if (!m_shader.loadFromFile("resources/billboard.vert", "resources/billboard.geom", "resources/billboard.frag"))
            return false;

        // Set the render resolution (used for proper scaling)
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          for (std::size_t i = 0; i < NumOfBillboards; i++)
          {
              m_pointCloud[i].position.x = rand() % (WindowWidth + WindowWidth) - (float)WindowWidth;
              m_pointCloud[i].position.y = rand() % (WindowWidth + WindowWidth) - (float)WindowWidth;
          }
        }
        // Reset our transformation matrix
        m_transform = sf::Transform::Identity;
        // Move to the center of the window
        //m_transform.translate(640, 360);
        m_transform.translate(WindowWidth / 2, WindowHeight / 2);
        // Rotate everything based on cursor position
        m_transform.rotate(x * 360.f);

        // Adjust billboard size to scale between 25 and 75
        float size = 25 + std::abs(y) * 50;

        // Update the shader parameter
        m_shader.setUniform("size", sf::Vector2f(size, size));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        // Prepare the render state
        states.shader = &m_shader;
        states.texture = &m_logoTexture;
        states.transform = m_transform;

        // Draw the point cloud
        target.draw(m_pointCloud, states);
    }

private:

    sf::Texture m_logoTexture;
    sf::Transform m_transform;
    sf::Shader m_shader;
    sf::VertexArray m_pointCloud;
};


//
// "Mixing Paint" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46805.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MixingPaint : public Effect
{
public:

    MixingPaint() :
    Effect("MIXING  PAINT")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MixingPaint.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;
};


//
// "Flying through space" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46525.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlyingThroughSpacev1 : public Effect
{
public:

    FlyingThroughSpacev1() :
    Effect("FLYING  THROUGH  SPACE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlyingThroughSpace-v1.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;


};




////////////////////////////////////////////////////////////
// "Tunnel of Light" fragment shader
////////////////////////////////////////////////////////////
class TunnelOfLight : public Effect
{
public:

    TunnelOfLight() :
    Effect("TUNNEL  OF  LIGHT")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TunnelOfLight.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};



////////////////////////////////////////////////////////////
// "Tunnel of Light" fragment shader
////////////////////////////////////////////////////////////
class TunnelOfElectrical: public Effect
{
public:

    TunnelOfElectrical() :
    Effect("TUNNEL  OF  ELECTRICAL  LIGHT")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TunnelOfElectrical.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};



////////////////////////////////////////////////////////////
// "Tunnel of Light" fragment shader
////////////////////////////////////////////////////////////
class Cityscape : public Effect
{
public:

    Cityscape() :
    Effect("CITYSCAPE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/Cityscape.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Voronoi In Real Time" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47779.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class VoronoiInRealTime: public Effect
{
public:

    VoronoiInRealTime() :
    Effect("VORONOI  PATTERNS  IN  REAL  TIME")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/VoronoiInRealTime.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Oil Paint Archipelago" fragment shader
//
//  Fragment Shader found at:
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class OilPaintArchipelago: public Effect
{
public:

    OilPaintArchipelago() :
    Effect("PAINT  ARCHIPELAGO  -  FRACTAL  OIL  PAINT  WITH  BROWNIAN  MOTION")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/OilPaintArchipelago.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Mesmerizing Triangles" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47784.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MesmerizingTriangles: public Effect
{
public:

    MesmerizingTriangles() :
    Effect("MESMERIZING  TRIANGLES  -  FRACTAL  OIL  PAINT  WITH  BROWNIAN  MOTION")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MesmerizingTriangles.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
        m_shader.setUniform("time", time);
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Attractor Polynomial Fractal" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47750.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AttractorPolynomialFractal: public Effect
{
public:

    AttractorPolynomialFractal() :
    Effect("ATTRACTOR  POLYNOMIAL  FRACTAL")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AttractorPolynomialFractal.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Blue Fog" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47847.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BlueFog: public Effect
{
public:

    BlueFog() :
    Effect("BLUE  FROG")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BlueFog.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Bubbling Primordial Ooze" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47811.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BubblingPrimordialOoze: public Effect
{
public:

    BubblingPrimordialOoze() :
    Effect("BUBBLING  PRIMORDIAL  OOZE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BubblingPrimordialOoze.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Matrix Corridor" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47695.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MatrixCorridor: public Effect
{
public:

    MatrixCorridor() :
    Effect("MATRIX  CORRIDOR")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MatrixCorridor.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "PlanetX" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47698.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PlanetX: public Effect
{
public:

    PlanetX() :
    Effect("PLANET  X")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PlanetX.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Lucy's Psychedelic And Groovy Diamonds" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47638.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class LucysPsychedelicAndGroovyDiamonds: public Effect
{
public:

    LucysPsychedelicAndGroovyDiamonds() :
    Effect("LUCY'S  PSYCHEDELIC  AND  GROOVY  DIAMONDS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/LucysPsychedelicAndGroovyDiamonds.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Blue And Orange Implosion" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47591.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
//  Notes:  This demo doesn't look like the one from the site when it is centered in the window. If it is located
//          at the bottom-left of the window, the look is correct but not centered.
//
class BlueAndOrangeImplosion: public Effect
{
public:

    BlueAndOrangeImplosion() :
    Effect("BLUE  AND  ORANGE  IMPLOSION")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BlueAndOrangeImplosion.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Vortex of Balloons" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47443.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class VortexOfBalloons: public Effect
{
public:

    VortexOfBalloons() :
    Effect("VORTEX  OF  BALLOONS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/VortexOfBalloons.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Voronoi Boxes" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47219.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class VoronoiBoxes: public Effect
{
public:

    VoronoiBoxes() :
    Effect("VORONOI  BOXES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/VoronoiBoxes.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));

    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Fire Ball" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47065.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FireBall: public Effect
{
public:

    FireBall() :
    Effect("FIRE  BALL")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FireBall.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));

    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Red Velvet Cake" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#47077.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RedVelvetCake: public Effect
{
public:

    RedVelvetCake() :
    Effect("RED  VELVET  CAKE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RedVelvetCake.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Orange Octopus" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46777.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class OrangeOctopus : public Effect
{
public:

    OrangeOctopus() :
    Effect("ANIMATED  ORANGE  OCTOPUS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/OrangeOctopus.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Another Joyful Programmer" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46637.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AnotherJoyfulProgrammer : public Effect
{
public:

    AnotherJoyfulProgrammer() :
    Effect("ANOTHER  JOYFUL  PROGRAMMER  (HAPPY FACE)")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AnotherJoyfulProgrammer.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Space - The Final Resting Place" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46575.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SpaceTheFinalRestingPlace: public Effect
{
public:

    SpaceTheFinalRestingPlace() :
    Effect("SPACE  -  THE  FINAL  RESTING  PLACE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SpaceTheFinalRestingPlace.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "The Psychedelic Padded Room" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46560.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ThePsychedelicPaddedRoom: public Effect
{
public:

    ThePsychedelicPaddedRoom() :
    Effect("THE  PSYCHODELIC  PADDED  ROOM")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ThePsychedelicPaddedRoom.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Life in the City at Dawn" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#46561.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class LifeInTheCityAtDawn: public Effect
{
public:

    LifeInTheCityAtDawn() :
    Effect("LIFE  IN  THE  CITY  AT  DAWN")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/LifeInTheCityAtDawn.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Mario Brothers on Cathrode Tube TV" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#45731.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MarioBrothersonCathrodeTubeTV : public Effect
{
public:

    MarioBrothersonCathrodeTubeTV() :
    Effect("MARIO  BROTHERS  ON  CATHRODE  TUBE  TV")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MarioBrothersonCathrodeTubeTV.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Screen Saver on old PC monitor" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#45490.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ScreenSaverOnOldPCMonitor: public Effect
{
public:

    ScreenSaverOnOldPCMonitor() :
    Effect("SCREEN  SAVER  ON  OLD  PC  MONITOR")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ScreenSaverOnOldPCMonitor.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Toon Clouds" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#45287.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ToonClouds: public Effect
{
public:

    ToonClouds() :
    Effect("TOON  CLOUDS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ToonClouds.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Animated Emoji" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#38740.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AnimatedEmoji: public Effect
{
public:

    AnimatedEmoji() :
    Effect("ANIMATED  EMOJI  WITH  EXPRESSIONS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AnimatedEmoji.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Animated Wood Grain" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#45082.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AnimatedWoodGrain: public Effect
{
public:

    AnimatedWoodGrain() :
    Effect("ANIMATED  WOOD  GRAIN")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AnimatedWoodGrain.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Wolfenstein 3D Demo" fragment shader
//
//  Fragment Shader found at:  http://glslsandbox.com/e#44827.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class Wolfenstein3DDemo: public Effect
{
public:

    Wolfenstein3DDemo() :
    Effect("WOLFENSTEIN  3D-LIKE  DEMO")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/Wolfenstein3DDemo.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "TextBlobs" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102412.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TextBlobs: public Effect
{
public:

    TextBlobs() :
    Effect("TEXTUAL  BLOBS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TextBlobs.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Animated Patterns" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102411.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AnimatedPatterns: public Effect
{
public:

    AnimatedPatterns() :
    Effect("VARIOUS  ANIMATED  PATTERNS")
    {
    }

    bool onLoad()
    {
        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AnimatedPatterns.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "FluidCurves" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102405.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FluidCurves: public Effect
{
public:

    FluidCurves() :
    Effect("FLUID  CURVES")
    {
    }

    bool onLoad()
    {
        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FluidCurves.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Swirling Fluid Blues" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102401.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SwirlingFluidBlues: public Effect
{
public:

    SwirlingFluidBlues() :
    Effect("SWIRLING  FLUID  BLUES")
    {
    }

    bool onLoad()
    {
        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SwirlingFluidBlues.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Running TV" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102383.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RunningTV: public Effect
{
public:

    RunningTV() :
    Effect("RUNNING  TELEVISION")
    {
    }

    bool onLoad()
    {
        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RunningTV.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Cannabola" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102379.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class Cannabola: public Effect
{
public:

    Cannabola() :
    Effect("CANNABOLA")
    {
    }

    bool onLoad()
    {
        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/Cannabola.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Bouncing Checkered Ball" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102373.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BouncingCheckeredBall: public Effect
{
public:

    BouncingCheckeredBall() :
    Effect("BOUNCING  CHECKERED  BALL  WITH  BORDER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BouncingCheckeredBall.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Capillary" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102378.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class Capillary: public Effect
{
public:

    Capillary() :
    Effect("RAINBOW  CAPILLARY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/Capillary.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "RGBBlobs" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102378.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RGBBlobs: public Effect
{
public:

    RGBBlobs() :
    Effect("RED,  GREEN,  AND  BLUE  MIXING  BLOBS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RGBBlobs.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Shrinking and Growing Ovals" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102375.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ShrinkingGrowingOvals: public Effect
{
public:

    ShrinkingGrowingOvals() :
    Effect("SHRINKING  AND  GROWING  OVALS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ShrinkingGrowingOvals.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Hypnotising Rotating Color Circle" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102369.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class HypnotisingRotatingColorCircle: public Effect
{
public:

    HypnotisingRotatingColorCircle() :
    Effect("HYPNOTISING  ROTATING  COLOR  CIRCLE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/HypnotisingRotatingColorCircle.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Fractal Brownian Motion Paint Like Forms" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102345.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FractalBrownianMotionPaintLikeForms: public Effect
{
public:

    FractalBrownianMotionPaintLikeForms() :
    Effect("FRACTAL  BROWNIAN  MOTION  PAINT-LIKE  FORMS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FractalBrownianMotionPaintLikeForms.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Rainbow Swirls" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102350.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RainbowSwirls: public Effect
{
public:

    RainbowSwirls() :
    Effect("RAINBOW  SWIRLS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RainbowSwirls.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Gigatron HSV Test" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102346.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class GigatronHSVTest: public Effect
{
public:

    GigatronHSVTest() :
    Effect("GIGATRON  HSV  TEST")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/GigatronHSVTest.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Flying Rainbow Blimp" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102304.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlyingRainbowBlimp: public Effect
{
public:

    FlyingRainbowBlimp() :
    Effect("FLYING  RAINBOW  BLIMP")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlyingRainbowBlimp.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Flaming Comet" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102304.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlamingComet: public Effect
{
public:

    FlamingComet() :
    Effect("FLAMING  COMET  THROUGH  SPACE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlamingComet.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Flying Jet Plane Over Water In Canyon" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102291.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlyingJetPlaneOverWaterInCanyon: public Effect
{
public:

    FlyingJetPlaneOverWaterInCanyon() :
    Effect("FLYING  JET  PLANE  OVER  WATER  IN  CANYON")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlyingJetPlaneOverWaterInCanyon.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Space Exploration Meets The 1980s" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102270.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SpaceExplorationMeetsThe1980s: public Effect
{
public:

    SpaceExplorationMeetsThe1980s() :
    Effect("SPACE  EXPLORATION  MEETS  THE  1980s")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SpaceExplorationMeetsThe1980s.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Colorful Star Traveling" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102270.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ColorfulStarTraveling: public Effect
{
public:

    ColorfulStarTraveling() :
    Effect("COLORFUL  STAR  TRAVELING")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ColorfulStarTraveling.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Aliens Scanner Scene" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102269.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AliensScannerScene: public Effect
{
public:

    AliensScannerScene() :
    Effect("SCANNER  SCENE  FROM  THE  MOVIE,  \"ALIENS\"")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AliensScannerScene.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Hyper Space Time Vortex" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102020.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class HyperSpaceTimeVortex: public Effect
{
public:

    HyperSpaceTimeVortex() :
    Effect("HYPERSPACE  &  TIME  VORTEX")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/HyperSpaceTimeVortex.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Laughing Demon Girl" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102020.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class LaughingDemonGirl: public Effect
{
public:

    LaughingDemonGirl() :
    Effect("LAUGHING  DEMON  GIRL")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/LaughingDemonGirl.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Hommage To Jochen Lempert" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102012.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class HommageToJochenLempert: public Effect
{
public:

    HommageToJochenLempert() :
    Effect("HOMMAGE  TO  JOCHEN  LEMPERT")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/HommageToJochenLempert.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Neon Wave Sunrise" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102005.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class NeonWaveSunrise: public Effect
{
public:

    NeonWaveSunrise() :
    Effect("NEON  WAVE  SUNRISE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/NeonWaveSunrise.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "US Space Capsule Over the Moon" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102006.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class USSpaceCapsuleOverTheMoon: public Effect
{
public:

    USSpaceCapsuleOverTheMoon() :
    Effect("US  SPACE  CAPSULE  OVER  THE  MOON")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/USSpaceCapsuleOverTheMoon.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Wavy Reflective Yellow and Pink Objects" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102007.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class WavyReflectiveYellowAndPinkObjects: public Effect
{
public:

    WavyReflectiveYellowAndPinkObjects() :
    Effect("WAVY,  REFLECTIVE,  YELLOW  AND  PINK  OBJECTS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/WavyReflectiveYellowAndPinkObjects.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Fractal Ball" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101992.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FractalBall: public Effect
{
public:

    FractalBall() :
    Effect("FRACTAL  BALL")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FractalBall.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Coastal Landscape" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102045.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CoastalLandscape: public Effect
{
public:

    CoastalLandscape() :
    Effect("COASTAL  LANDSCAPE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CoastalLandscape.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Evening in the Endless City" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102043.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class EveningInTheEndlessCity: public Effect
{
public:

    EveningInTheEndlessCity() :
    Effect("EVENING  IN  THE  ENDLESS  CITY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/EveningInTheEndlessCity.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Under Water Bubbles" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102042.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class UnderWaterBubbles: public Effect
{
public:

    UnderWaterBubbles() :
    Effect("UNDERWATER  BUBBLES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/UnderWaterBubbles.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Glass Pride" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102038.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class GlassPride: public Effect
{
public:

    GlassPride() :
    Effect("GLASS  PRIDE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/GlassPride.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Glass Texture" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102039.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class GlassTexture: public Effect
{
public:

    GlassTexture() :
    Effect("GLASS  TEXTURE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/GlassTexture.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Simple 2D Game Graphics Demo" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102040.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class Simple2DGameGraphicsDemo: public Effect
{
public:

    Simple2DGameGraphicsDemo() :
    Effect("SIMPLE  2D  GAME  GRAPHICS  DEMO")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/Simple2DGameGraphicsDemo.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Mirrored Ordered Chaos" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102033.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MirroredOrderedChaos: public Effect
{
public:

    MirroredOrderedChaos() :
    Effect("MIRRORED  ORDERED  CHAOS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MirroredOrderedChaos.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Mandelbrot Fractal Zoom" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102032.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MandelbrotFractalZoom: public Effect
{
public:

    MandelbrotFractalZoom() :
    Effect("MANDELBROT  FRACTAL  ZOOM")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MandelbrotFractalZoom.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Raytraced Extruded Star" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102024.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RaytracedExtrudedStar: public Effect
{
public:

    RaytracedExtrudedStar() :
    Effect("RAYTRACED  EXTRUDED  STAR")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RaytracedExtrudedStar.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Noisy Vertical Lines" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102029.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class NoisyVerticalLines: public Effect
{
public:

    NoisyVerticalLines() :
    Effect("NOISY  VERTICAL  LINES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/NoisyVerticalLines.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Noisy Fractal God Cube" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102072.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class NoisyFractalGodCube: public Effect
{
public:

    NoisyFractalGodCube() :
    Effect("NOISY  FRACTAL  GOD  CUBE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/NoisyFractalGodCube.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Noisy Living Blood of God" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102063.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class NoisyLivingBloodOfGod: public Effect
{
public:

    NoisyLivingBloodOfGod() :
    Effect("NOISY  AND  LIVING  BLOOD  OF  GOD")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/NoisyLivingBloodOfGod.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Carbon Crystal Dimensional Data Center" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102062.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CarbonCrystalDimensionalDataCenter: public Effect
{
public:

    CarbonCrystalDimensionalDataCenter() :
    Effect("CARBON  CRYSTAL  DIMENSIONAL  DATA  CENTER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CarbonCrystalDimensionalDataCenter.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Three Digit Embossed Counter" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102052.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ThreeDigitEmbossedCounter: public Effect
{
public:

    ThreeDigitEmbossedCounter() :
    Effect("THREE  DIGIT  EMBOSSED  COUNTER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ThreeDigitEmbossedCounter.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Fractured Realities" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102053.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FracturedRealities: public Effect
{
public:

    FracturedRealities() :
    Effect("FRACTURED  REALITIES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FracturedRealities.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Flying Through a Menger Spnge" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102054.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlyingThroughAMengerSponge: public Effect
{
public:

    FlyingThroughAMengerSponge() :
    Effect("FLYING  THROUGH  A  MENGER  SPONGE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlyingThroughAMengerSponge.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Circling God Particle" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102049.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CirclingGodParticle: public Effect
{
public:

    CirclingGodParticle() :
    Effect("GOD  PARTICLE  CIRCLING  AROUND  A  GOD  CUBE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CirclingGodParticle.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Car Driving in the Rain" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102082.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CarDrivingInTheRain: public Effect
{
public:

    CarDrivingInTheRain() :
    Effect("CAR  DRIVING  IN  THE  RAIN")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CarDrivingInTheRain.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Nautilus at Sunset" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102122.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class NautilusAtSunset: public Effect
{
public:

    NautilusAtSunset() :
    Effect("NAUTILUS  AT  SUNSET")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/NautilusAtSunset.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Space View with Grids" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101308.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SpaceViewWithGrids: public Effect
{
public:

    SpaceViewWithGrids() :
    Effect("SPACE  VIEW  WITH  GRID  LINES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SpaceViewWithGrids.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Revised Reality at the Theater" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102100.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RevisedRealityAtTheTheater: public Effect
{
public:

    RevisedRealityAtTheTheater() :
    Effect("REVISED  REALITY  AT  THE  THEATER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RevisedRealityAtTheTheater.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Aurora Borealis" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102101.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AuroraBorealis: public Effect
{
public:

    AuroraBorealis() :
    Effect("AURORA  BOREALIS  LIGHTS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AuroraBorealis.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Plastic Flower Machine" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102104.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PlasticFlowerMachine: public Effect
{
public:

    PlasticFlowerMachine() :
    Effect("PLASTIC  FLOWER  MACHINE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PlasticFlowerMachine.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "A Star in a Star Nest" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102099.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AStarInAStarNest: public Effect
{
public:

    AStarInAStarNest() :
    Effect("A  STAR  IN  A  STAR  NEST")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AStarInAStarNest.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Pulsating Living Crystal" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102137.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PulsatingLivingCrystal: public Effect
{
public:

    PulsatingLivingCrystal() :
    Effect("PULSATING  LIVING  CRYSTAL")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PulsatingLivingCrystal.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Cellular Bubbles" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102138.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CellularBubbles: public Effect
{
public:

    CellularBubbles() :
    Effect("CELLULAR  BUBBLES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CellularBubbles.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Meglatron Crystals" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102139.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MeglatronCrystals: public Effect
{
public:

    MeglatronCrystals() :
    Effect("MEGLATRON  CRYSTALS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MeglatronCrystals.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Fractal Coffee Pads" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102173.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FractalCoffeePads: public Effect
{
public:

    FractalCoffeePads() :
    Effect("FRACTAL  COFFEE  PADS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FractalCoffeePads.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Dark Crystal Corridor" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102156.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class DarkCrystalCorridor: public Effect
{
public:

    DarkCrystalCorridor() :
    Effect("DARK  CRYSTAL  CORRIDOR")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/DarkCrystalCorridor.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Mesmerizing Rippling Persona Stars" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102151.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MesmerizingRipplingPersonaStars: public Effect
{
public:

    MesmerizingRipplingPersonaStars() :
    Effect("MESMERIZING,  RIPPLING  PERSONA  STARS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MesmerizingRipplingPersonaStars.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Living Crystaline Entity" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102131.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class LivingCrystalineEntity: public Effect
{
public:

    LivingCrystalineEntity() :
    Effect("LIVING  CRYSTALINE  ENTITY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/LivingCrystalineEntity.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Rough Waves" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102126.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RoughWaves: public Effect
{
public:

    RoughWaves() :
    Effect("ROUGH  WAVES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RoughWaves.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Kaleidoscope Fractals" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102158.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class KaleidoscopeFractals: public Effect
{
public:

    KaleidoscopeFractals() :
    Effect("KALEIDOSCOPE  FRACTALS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/KaleidoscopeFractals.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Loading Circle" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102195.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class LoadingCircle: public Effect
{
public:

    LoadingCircle() :
    Effect("LOADING  CIRCLE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/LoadingCircle.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Endless Mountain Ranges" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102192.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class EndlessMountainRanges: public Effect
{
public:

    EndlessMountainRanges() :
    Effect("ENDLESS  MOUNTAIN  RANGES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/EndlessMountainRanges.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Sunken Blocks on Sea Floor" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102190.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SunkenBlocksOnSeaFloor: public Effect
{
public:

    SunkenBlocksOnSeaFloor() :
    Effect("SUNKEN  BLOCKS  ON  SEA  FLOOR")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SunkenBlocksOnSeaFloor.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Paint Droplets Fractal" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102185.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PaintDropletsFractal: public Effect
{
public:

    PaintDropletsFractal() :
    Effect("FRACTAL  MADE  OF  RESIZING  PAINT  DROPLETS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PaintDropletsFractal.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Alien Forest with Strand Beasts" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102178.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AlienForestWithStrandBeasts: public Effect
{
public:

    AlienForestWithStrandBeasts() :
    Effect("WHITE  ALIEN  FOREST  WITH  STRAND  BEASTS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AlienForestWithStrandBeasts.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Pig Face" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102177.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PigFace: public Effect
{
public:

    PigFace() :
    Effect("PIG  FACE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PigFace.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Milk Cubes" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102176.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MilkCubes: public Effect
{
public:

    MilkCubes() :
    Effect("MILK  CUBES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MilkCubes.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Blue and Orange Milky Tentacles" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102183.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BlueAndOrangeMilkyTentacles: public Effect
{
public:

    BlueAndOrangeMilkyTentacles() :
    Effect("BLUE  AND  ORANGE  MILKY  TENTACLES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BlueAndOrangeMilkyTentacles.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Twisting Symbol of Life" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102225.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TwistingSymbolOfLife: public Effect
{
public:

    TwistingSymbolOfLife() :
    Effect("TWISTING  SYMBOL  OF  LIFE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TwistingSymbolOfLife.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "The Great and Powerful Wizard of OZ" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102226.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TheGreatAndPowerfulWizardOfOZ: public Effect
{
public:

    TheGreatAndPowerfulWizardOfOZ() :
    Effect("THE  GREAT  AND  POWERFUL  WIZARD  OF  OZ")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TheGreatAndPowerfulWizardOfOZ.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "The Son of the Great and Powerful Wizard of OZ" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102223.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TheSonOfTheGreatAndPowerfulWizardOfOZ: public Effect
{
public:

    TheSonOfTheGreatAndPowerfulWizardOfOZ() :
    Effect("THE  SON  OF  THE  GREAT  AND  POWERFUL  WIZARD  OF  OZ")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TheSonOfTheGreatAndPowerfulWizardOfOZ.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Kids Drawing of a Day in the Country" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102004.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class KidsDrawingOfADayInTheCountry: public Effect
{
public:

    KidsDrawingOfADayInTheCountry() :
    Effect("KIDS  DRAWING  OF  A  DAY  IN  THE  COUNTRY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/KidsDrawingOfADayInTheCountry.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Colorized Translucent Springs" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101995.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TranslucentColorizedSprings: public Effect
{
public:

    TranslucentColorizedSprings() :
    Effect("TRANSLUCENT,  COLORIZED  SPRINGS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TranslucentColorizedSprings.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Two-Tier Birthday Cake" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101994.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TwoTierBirthdayCake: public Effect
{
public:

    TwoTierBirthdayCake() :
    Effect("TWO-TIER  BIRTHDAY  CAKE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TwoTierBirthdayCake.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Tunnel of Bars and Lights" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101991.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TunnelOfBarsAndLights: public Effect
{
public:

    TunnelOfBarsAndLights() :
    Effect("TUNNEL  OF  BARS  AND  LIGHTS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TunnelOfBarsAndLights.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Stars, Dust and Gas in Space" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101996.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class StarsDustAndGasInSpace: public Effect
{
public:

    StarsDustAndGasInSpace() :
    Effect("STARS,  DUST  AND  GAS  IN  SPACE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/StarsDustAndGasInSpace.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Cayley Graph of the Symmetric Group S5" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102003.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CayleyGraphOfTheSymmetricGroupS5: public Effect
{
public:

    CayleyGraphOfTheSymmetricGroupS5() :
    Effect("CAYLEY  GRAPH  OF  THE  SYMMETRIC  GROUP  S5")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CayleyGraphOfTheSymmetricGroupS5.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "The Bouncing Sea Panther Character" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102016.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TheBouncingSeaPantherCharacter: public Effect
{
public:

    TheBouncingSeaPantherCharacter() :
    Effect("THE  BOUNCING  SEA  PANTHER  CHARACTER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TheBouncingSeaPantherCharacter.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "The Color and Shape Transforming Bone Structure" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102008.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TheColorAndShapeTransformingBoneStructure: public Effect
{
public:

    TheColorAndShapeTransformingBoneStructure() :
    Effect("THE  COLOR  AND SHAPE  TRANSFORMING  BONE  STRUCTURE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TheColorAndShapeTransformingBoneStructure.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Running Bears and Cube on Checkered Plane" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102008.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RunningBearsAndCubeOnCheckeredPlane: public Effect
{
public:

    RunningBearsAndCubeOnCheckeredPlane() :
    Effect("RUNNING  BEARS  AND  A  6CUBE  ON  CHECKERED  PLANE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RunningBearsAndCubeOnCheckeredPlane.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Multidimensional Power Rings Spinning Around Power Sphere" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102021.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MultidimensionalPowerRingsSpinningAroundPowerSphere: public Effect
{
public:

    MultidimensionalPowerRingsSpinningAroundPowerSphere() :
    Effect("MULTIDIMENSIONAL  POWER  RINGS  SPINNING  AROUND  POWER  SPHERE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MultidimensionalPowerRingsSpinningAroundPowerSphere.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Raceway City" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101935.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RacewayCity: public Effect
{
public:

    RacewayCity() :
    Effect("RACEWAY  CITY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RacewayCity.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Side View ofMountains Sun and fog" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101935.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SideviewOfMountainsSunAndFog: public Effect
{
public:

    SideviewOfMountainsSunAndFog() :
    Effect("SIDE  VIEW  OF  MOUNTAINS,  SUN,  AND  FOG")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SideviewOfMountainsSunAndFog.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Sewage Tunnel" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101930.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SewageTunnel: public Effect
{
public:

    SewageTunnel() :
    Effect("SEWAGE  TUNNEL")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SewageTunnel.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Pellet Arc" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101929.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PelletArc: public Effect
{
public:

    PelletArc() :
    Effect("PELLET  ARC")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PelletArc.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Basketball Court Shoots and Scores" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101927.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BasketballCourtShootsAndScores: public Effect
{
public:

    BasketballCourtShootsAndScores() :
    Effect("BASKETBALL  COURT  -  SHOOTS  AND  SCORES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BasketballCourtShootsAndScores.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Road Runner Bird" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101925.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class RoadRunnerBird: public Effect
{
public:

    RoadRunnerBird() :
    Effect("ROAD  RUNNER  BIRD  IN  THE  DESERT")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/RoadRunnerBird.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Flipping Squares" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101922.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlippingSquares: public Effect
{
public:

    FlippingSquares() :
    Effect("FLIPPING  SQUARES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlippingSquares.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Braided Threads" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101921.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BraidedThreads: public Effect
{
public:

    BraidedThreads() :
    Effect("BRAIDED  THREADS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BraidedThreads.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Sand and Water Wave Effect" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101949.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SandAndWaterWaveEffect: public Effect
{
public:

    SandAndWaterWaveEffect() :
    Effect("SAND  AND  WATER  WAVE  EFFECT")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SandAndWaterWaveEffect.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Circular Rotating Color Wheel with Rings" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101950.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class CircularRotatingColorWheelWithRings: public Effect
{
public:

    CircularRotatingColorWheelWithRings() :
    Effect("CIRCULAR  ROTATING  COLOR  WHEEL  WITH  RINGS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/CircularRotatingColorWheelWithRings.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Picture Frame Border" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101870.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class PictureFrameBorder: public Effect
{
public:

    PictureFrameBorder() :
    Effect("PICTURE  FRAME  BORDER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/PictureFrameBorder.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Bonneval-Sur-Arc Winter Town" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101869.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BonnevalSurArcWinterTown: public Effect
{
public:

    BonnevalSurArcWinterTown() :
    Effect("BONNEVAL-SUR-ARC  -  WINTER  TOWN")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BonnevalSurArcWinterTown.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Tenacle Light Inside Room with Windows" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101867.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TenacleLightInsideRoomWithWindows: public Effect
{
public:

    TenacleLightInsideRoomWithWindows() :
    Effect("TENACLE  LIGHT  INSIDE  ROOM  WITH  WINDOWS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TenacleLightInsideRoomWithWindows.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Time Warping Singularity" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101860.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TimeWarpingSingularity: public Effect
{
public:

    TimeWarpingSingularity() :
    Effect("TIME  WARPING  SINGULARITY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TimeWarpingSingularity.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "The Simpsons - Homer Simpson At Home" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101862.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class TheSimpsonsHomerSimpsonAtHome: public Effect
{
public:

    TheSimpsonsHomerSimpsonAtHome() :
    Effect("THE  SIMPSONS  -  HOMER  SIMPSON  AT  HOME")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/TheSimpsonsHomerSimpsonAtHome.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Ball Bearing Factory" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101864.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BallBearingFactory: public Effect
{
public:

    BallBearingFactory() :
    Effect("BALL  BEARING  FACTORY")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BallBearingFactory.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Movie Poster - The Exorcist (1973)" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101866.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class MoviePosterTheExorcist1973: public Effect
{
public:

    MoviePosterTheExorcist1973() :
    Effect("MOVIE  POSTER  -  THE  EXORCIST  (1973)")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/MoviePosterTheExorcist1973.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Movie Poster - The Exorcist (1973)" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101859.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class AndroidWorkerPrototype5: public Effect
{
public:

    AndroidWorkerPrototype5() :
    Effect("ANDROID  WORKER  PROTOTYPE  #5")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/AndroidWorkerPrototype5.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Fields Bounding Spheres" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101856.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FieldsBoundingSpheres: public Effect
{
public:

    FieldsBoundingSpheres() :
    Effect("FIELDS  BOUNDING  SPHERES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FieldsBoundingSpheres.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Sunrise Over the Ocean with Mountains" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#101852.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SunriseOverTheOceanWithMountains: public Effect
{
public:

    SunriseOverTheOceanWithMountains() :
    Effect("SUNRISE  OVER  THE  OCEAN  WITH  MOUNTAINS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SunriseOverTheOceanWithMountains.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Conformal Polygonal Morphism" fragment shader
//
//  Fragment Shader found at:  https://www.shadertoy.com/view/3tdczr
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class ConformalPolygonalMorphism: public Effect
{
public:

    ConformalPolygonalMorphism() :
    Effect("CONFORMAL  POLYGONAL  MORPHISM")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/ConformalPolygonalMorphism.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "BiPlanes Flying Through Space" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102885.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class BiPlanesFlyingThroughSpace: public Effect
{
public:

    BiPlanesFlyingThroughSpace() :
    Effect("BIPLANES  FLYING  THROUGH  SPACE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/BiPlanesFlyingThroughSpace.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Flamboyant Smash Wobbler Inducer" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102873.0 & https://www.poshbrolly.net/shader/wdh0cfgKU4rLwP9mlqCI
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class FlamboyantSmashWobblerInducer: public Effect
{
public:

    FlamboyantSmashWobblerInducer() :
    Effect("FLAMBOYANT  SMASH  WOBBLER  INDUCER")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/FlamboyantSmashWobblerInducer.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Dark Sphere Inside Nebula" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102822.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class DarkSphereInsideNebula: public Effect
{
public:

    DarkSphereInsideNebula() :
    Effect("DARK  SPHERE  INSIDE  NEBULA")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/DarkSphereInsideNebula.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Spheres with Different Material Properties" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102797.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class SpheresWithDifferentMaterialProperties: public Effect
{
public:

    SpheresWithDifferentMaterialProperties() :
    Effect("SPHERES  WITH  DIFFERENT  MATERIAL  PROPERTIES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/SpheresWithDifferentMaterialProperties.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Liquefied Colorful Smoke" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102766.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class LiquefiedColorfulSmoke: public Effect
{
public:

    LiquefiedColorfulSmoke() :
    Effect("LIQUEFIED  COLORFUL  SMOKE")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/LiquefiedColorfulSmoke.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "Happy Face with Happy Spheres" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#102654.0
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class HappyFaceWithHappySpheres: public Effect
{
public:

    HappyFaceWithHappySpheres() :
    Effect("HAPPY  FACE  FLOWER  WITH  HAPPY  SPHERES")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/HappyFaceWithHappySpheres.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


//
// "White Woman Sleeping in Water with Watermelons" fragment shader
//
//  Fragment Shader found at:  https://glslsandbox.com/e#63597.1
//  Added to SFML's shader demo by:  Waltersmind  a.k.a.  Walter Whitman  a.k.a.  The Joyful Programmer
//  www.TheJoyful Programmer
//
class WhiteWomanSleepingInWaterWithWatermelons: public Effect
{
public:

    WhiteWomanSleepingInWaterWithWatermelons() :
    Effect("WHITE  WOMAN  SLEEPING  IN  WATER  WITH  WATERMELONS")
    {
    }

    bool onLoad()
    {

        if (!m_surface.create(WindowWidth, WindowHeight))
            return false;
        m_surface.setSmooth(true);

        WindowWidthCompare = WindowWidth;
        WindowHeightCompare = WindowHeight;

        // Load the shader
        if (!m_shader.loadFromFile("resources/WhiteWomanSleepingInWaterWithWatermelons.frag", sf::Shader::Fragment))
            return false;

        return true;
    }

    void onUpdate(float time, float x, float y)
    {
        if ((WindowWidth != WindowWidthCompare) || (WindowHeight != WindowHeightCompare)) {
          WindowWidthCompare = WindowWidth;
          WindowHeightCompare = WindowHeight;

          m_surface.create(WindowWidth, WindowHeight);
          m_surface.setSmooth(true);
        }

        m_shader.setUniform("time", time);
        //m_shader.setUniform("mouse", sf::Vector2f(x, y));
        m_shader.setUniform("resolution", sf::Vector2f(WindowWidth, WindowHeight));
    }

    void onDraw(sf::RenderTarget& target, sf::RenderStates states) const
    {
        states.shader = &m_shader;
        target.draw(sf::Sprite(m_surface.getTexture()), states);
    }

private:

    sf::Shader m_shader;
    sf::RenderTexture m_surface;

};


int main()
{
    // CREATE THE WINDOW THROUGH SFML
    sf::RenderWindow window(sf::VideoMode(WindowWidth, WindowHeight), "SFML Fragment Shaders - Modified by Waltersmind, The Joyful Programmer",
                            sf::Style::Titlebar | sf::Style::Close | sf::Style::Resize);
    window.setVerticalSyncEnabled(true);

    // Load the application font and pass it to the Effect class
    sf::Font font;
    if (!font.loadFromFile("resources/sansation.ttf"))
        return EXIT_FAILURE;

    //Effect::setFont(font);

    sf::Font PTSansRegular;
    if (!PTSansRegular.loadFromFile("resources/PTSans-Regular.ttf"))
        return EXIT_FAILURE;

    Effect::setFont(PTSansRegular);

    sf::Font PTSansBold;
    if (!PTSansBold.loadFromFile("resources/PTSans-Bold.ttf"))
        return EXIT_FAILURE;

    sf::Font LilitaOne;
    if (!LilitaOne.loadFromFile("resources/LilitaOne-Regular.ttf"))
        return EXIT_FAILURE;

    sf::Font RussoOne;
    if (!RussoOne.loadFromFile("resources/RussoOne-Regular.ttf"))
        return EXIT_FAILURE;

    sf::Font Anton;
    if (!Anton.loadFromFile("resources/Anton-Regular.ttf"))
        return EXIT_FAILURE;

    sf::Font SecularOne;
    if (!SecularOne.loadFromFile("resources/SecularOne-Regular.ttf"))
        return EXIT_FAILURE;

    // CREATE A VECTOR ARRAY TO STORE ALL THE EFFECT OBJECTS IN
    std::vector<std::unique_ptr<Effect>> Effects;

    //  ADD SHADER EFFECT OBJECTS TO THE VECTOR ARRAY
    //  THE FOLLOWING SHADERS ARE THE ORIGINAL ONES INCLUDED IN THE SFML DEMO.
    Effects.push_back(std::make_unique<Pixelate>());
    Effects.push_back(std::make_unique<WaveBlur>());
    Effects.push_back(std::make_unique<StormBlink>());
    Effects.push_back(std::make_unique<Edge>());
    Effects.push_back(std::make_unique<Geometry>());
    Effects.push_back(std::make_unique<MixingPaint>());
    Effects.push_back(std::make_unique<FlyingThroughSpacev1>());
    Effects.push_back(std::make_unique<TunnelOfLight>());
    Effects.push_back(std::make_unique<TunnelOfElectrical>());
    Effects.push_back(std::make_unique<Cityscape>());

    Effects.push_back(std::make_unique<VoronoiInRealTime>());
    Effects.push_back(std::make_unique<MesmerizingTriangles>());
    Effects.push_back(std::make_unique<AttractorPolynomialFractal>());
    Effects.push_back(std::make_unique<BlueFog>());
    Effects.push_back(std::make_unique<BubblingPrimordialOoze>());
    Effects.push_back(std::make_unique<MatrixCorridor>());
    Effects.push_back(std::make_unique<PlanetX>());
    Effects.push_back(std::make_unique<LucysPsychedelicAndGroovyDiamonds>());
    Effects.push_back(std::make_unique<BlueAndOrangeImplosion>());
    Effects.push_back(std::make_unique<VortexOfBalloons>());

    Effects.push_back(std::make_unique<VoronoiBoxes>());
    Effects.push_back(std::make_unique<FireBall>());
    Effects.push_back(std::make_unique<RedVelvetCake>());
    Effects.push_back(std::make_unique<OrangeOctopus>());
    Effects.push_back(std::make_unique<AnotherJoyfulProgrammer>());
    Effects.push_back(std::make_unique<SpaceTheFinalRestingPlace>());
    Effects.push_back(std::make_unique<ThePsychedelicPaddedRoom>());
    Effects.push_back(std::make_unique<LifeInTheCityAtDawn>());
    Effects.push_back(std::make_unique<ScreenSaverOnOldPCMonitor>());
    Effects.push_back(std::make_unique<ToonClouds>());

    Effects.push_back(std::make_unique<AnimatedEmoji>());
    Effects.push_back(std::make_unique<AnimatedWoodGrain>());
    Effects.push_back(std::make_unique<Wolfenstein3DDemo>());
    Effects.push_back(std::make_unique<MarioBrothersonCathrodeTubeTV>());
    Effects.push_back(std::make_unique<TextBlobs>());
    Effects.push_back(std::make_unique<AnimatedPatterns>());
    Effects.push_back(std::make_unique<FluidCurves>());
    Effects.push_back(std::make_unique<SwirlingFluidBlues>());
    Effects.push_back(std::make_unique<RunningTV>());
    Effects.push_back(std::make_unique<Cannabola>());

    Effects.push_back(std::make_unique<BouncingCheckeredBall>());
    Effects.push_back(std::make_unique<Capillary>());
    Effects.push_back(std::make_unique<RGBBlobs>());
    Effects.push_back(std::make_unique<ShrinkingGrowingOvals>());
    Effects.push_back(std::make_unique<HypnotisingRotatingColorCircle>());
    Effects.push_back(std::make_unique<FractalBrownianMotionPaintLikeForms>());
    Effects.push_back(std::make_unique<RainbowSwirls>());
    Effects.push_back(std::make_unique<GigatronHSVTest>());
    Effects.push_back(std::make_unique<FlyingRainbowBlimp>());
    Effects.push_back(std::make_unique<FlamingComet>());

    Effects.push_back(std::make_unique<HyperSpaceTimeVortex>());
    Effects.push_back(std::make_unique<LaughingDemonGirl>());
    Effects.push_back(std::make_unique<TheGreatAndPowerfulWizardOfOZ>());
    Effects.push_back(std::make_unique<TheSonOfTheGreatAndPowerfulWizardOfOZ>());
    Effects.push_back(std::make_unique<FlyingJetPlaneOverWaterInCanyon>());
    Effects.push_back(std::make_unique<SpaceExplorationMeetsThe1980s>());
    Effects.push_back(std::make_unique<ColorfulStarTraveling>());
    Effects.push_back(std::make_unique<AliensScannerScene>());
    Effects.push_back(std::make_unique<HommageToJochenLempert>());
    Effects.push_back(std::make_unique<NeonWaveSunrise>());

    Effects.push_back(std::make_unique<USSpaceCapsuleOverTheMoon>());
    Effects.push_back(std::make_unique<WavyReflectiveYellowAndPinkObjects>());
    Effects.push_back(std::make_unique<FractalBall>());
    Effects.push_back(std::make_unique<CoastalLandscape>());
    Effects.push_back(std::make_unique<EveningInTheEndlessCity>());
    Effects.push_back(std::make_unique<UnderWaterBubbles>());
    Effects.push_back(std::make_unique<GlassPride>());
    Effects.push_back(std::make_unique<GlassTexture>());
    Effects.push_back(std::make_unique<Simple2DGameGraphicsDemo>());
    Effects.push_back(std::make_unique<MirroredOrderedChaos>());

    Effects.push_back(std::make_unique<MandelbrotFractalZoom>());
    Effects.push_back(std::make_unique<RaytracedExtrudedStar>());
    Effects.push_back(std::make_unique<NoisyVerticalLines>());
    Effects.push_back(std::make_unique<NoisyFractalGodCube>());
    Effects.push_back(std::make_unique<NoisyLivingBloodOfGod>());
    Effects.push_back(std::make_unique<CarbonCrystalDimensionalDataCenter>());
    Effects.push_back(std::make_unique<ThreeDigitEmbossedCounter>());
    Effects.push_back(std::make_unique<FracturedRealities>());
    Effects.push_back(std::make_unique<FlyingThroughAMengerSponge>());
    Effects.push_back(std::make_unique<CirclingGodParticle>());

    Effects.push_back(std::make_unique<CarDrivingInTheRain>());
    Effects.push_back(std::make_unique<NautilusAtSunset>());
    Effects.push_back(std::make_unique<SpaceViewWithGrids>());
    Effects.push_back(std::make_unique<RevisedRealityAtTheTheater>());
    Effects.push_back(std::make_unique<AuroraBorealis>());
    Effects.push_back(std::make_unique<PlasticFlowerMachine>());
    Effects.push_back(std::make_unique<AStarInAStarNest>());
    Effects.push_back(std::make_unique<PulsatingLivingCrystal>());
    Effects.push_back(std::make_unique<CellularBubbles>());
    Effects.push_back(std::make_unique<MeglatronCrystals>());

    Effects.push_back(std::make_unique<DarkCrystalCorridor>());
    Effects.push_back(std::make_unique<LivingCrystalineEntity>());
    Effects.push_back(std::make_unique<FractalCoffeePads>());
    Effects.push_back(std::make_unique<MesmerizingRipplingPersonaStars>());
    Effects.push_back(std::make_unique<RoughWaves>());
    Effects.push_back(std::make_unique<KaleidoscopeFractals>());
    Effects.push_back(std::make_unique<LoadingCircle>());
    Effects.push_back(std::make_unique<EndlessMountainRanges>());
    Effects.push_back(std::make_unique<SunkenBlocksOnSeaFloor>());
    Effects.push_back(std::make_unique<PaintDropletsFractal>());

    Effects.push_back(std::make_unique<AlienForestWithStrandBeasts>());
    Effects.push_back(std::make_unique<PigFace>());
    Effects.push_back(std::make_unique<MilkCubes>());
    Effects.push_back(std::make_unique<BlueAndOrangeMilkyTentacles>());
    Effects.push_back(std::make_unique<TwistingSymbolOfLife>());
    Effects.push_back(std::make_unique<KidsDrawingOfADayInTheCountry>());
    Effects.push_back(std::make_unique<TranslucentColorizedSprings>());
    Effects.push_back(std::make_unique<TwoTierBirthdayCake>());
    Effects.push_back(std::make_unique<TunnelOfBarsAndLights>());
    Effects.push_back(std::make_unique<StarsDustAndGasInSpace>());

    Effects.push_back(std::make_unique<CayleyGraphOfTheSymmetricGroupS5>());
    Effects.push_back(std::make_unique<TheBouncingSeaPantherCharacter>());
    Effects.push_back(std::make_unique<TheColorAndShapeTransformingBoneStructure>());
    Effects.push_back(std::make_unique<RunningBearsAndCubeOnCheckeredPlane>());
    Effects.push_back(std::make_unique<MultidimensionalPowerRingsSpinningAroundPowerSphere>());
    Effects.push_back(std::make_unique<RacewayCity>());
    Effects.push_back(std::make_unique<SideviewOfMountainsSunAndFog>());
    Effects.push_back(std::make_unique<SewageTunnel>());
    Effects.push_back(std::make_unique<PelletArc>());
    Effects.push_back(std::make_unique<BasketballCourtShootsAndScores>());

    Effects.push_back(std::make_unique<RoadRunnerBird>());
    Effects.push_back(std::make_unique<FlippingSquares>());
    Effects.push_back(std::make_unique<BraidedThreads>());
    Effects.push_back(std::make_unique<SandAndWaterWaveEffect>());
    Effects.push_back(std::make_unique<CircularRotatingColorWheelWithRings>());
    Effects.push_back(std::make_unique<PictureFrameBorder>());
    Effects.push_back(std::make_unique<BonnevalSurArcWinterTown>());
    Effects.push_back(std::make_unique<TenacleLightInsideRoomWithWindows>());
    Effects.push_back(std::make_unique<TimeWarpingSingularity>());
    Effects.push_back(std::make_unique<TheSimpsonsHomerSimpsonAtHome>());

    Effects.push_back(std::make_unique<BallBearingFactory>());
    Effects.push_back(std::make_unique<MoviePosterTheExorcist1973>());
    Effects.push_back(std::make_unique<AndroidWorkerPrototype5>());
    Effects.push_back(std::make_unique<FieldsBoundingSpheres>());
    Effects.push_back(std::make_unique<SunriseOverTheOceanWithMountains>());
    Effects.push_back(std::make_unique<ConformalPolygonalMorphism>());
    Effects.push_back(std::make_unique<BiPlanesFlyingThroughSpace>());
    Effects.push_back(std::make_unique<FlamboyantSmashWobblerInducer>());
    Effects.push_back(std::make_unique<DarkSphereInsideNebula>());
    Effects.push_back(std::make_unique<SpheresWithDifferentMaterialProperties>());

    Effects.push_back(std::make_unique<LiquefiedColorfulSmoke>());
    Effects.push_back(std::make_unique<HappyFaceWithHappySpheres>());
    Effects.push_back(std::make_unique<WhiteWomanSleepingInWaterWithWatermelons>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());

    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());
    //Effects.push_back(std::make_unique<>());


    std::size_t current = 0;

    // Initialize them
    for (std::size_t CurrentObject{0}; CurrentObject < Effects.size(); CurrentObject++)
      Effects[CurrentObject]->load();

    //sf::Text DescriptionEffect(Effects[current]->getName(), PTSansBold, 32);
    sf::Text DescriptionEffect(Effects[current]->getName(), LilitaOne, 32);
    sf::Text DemoCount("", LilitaOne, 24);
    sf::Text MouseInfo("TRY MOVING THE MOUSE", LilitaOne, 24);

    // Start the game loop
    sf::Clock clock;
    while (window.isOpen())
    {
        // Process events
        sf::Event event;
        while (window.pollEvent(event))
        {
            // Close window: exit
            if (event.type == sf::Event::Closed)
                window.close();

            if (event.type == sf::Event::Resized)
            {
                // update the view to the new size of the window
                sf::FloatRect visibleArea(0, 0, event.size.width, event.size.height);
                WindowWidth = event.size.width;
                WindowHeight = event.size.height;
                window.setView(sf::View(visibleArea));
            }

            if (event.type == sf::Event::KeyPressed)
            {
                switch (event.key.code)
                {
                    // Escape key: exit
                    case sf::Keyboard::Escape:
                        window.close();
                        break;

                    // Left arrow key: previous shader
                    case sf::Keyboard::Left:
                        if (current == 0)
                            current = Effects.size() - 1;
                        else
                            current--;

                        //description.setString("Current effect:  " + effects[current]->getName());
                        DescriptionEffect.setString(Effects[current]->getName());
                        clock.restart();
                        break;

                    // Right arrow key: next shader
                    case sf::Keyboard::Right:

                        if (current == Effects.size() - 1)
                            current = 0;
                        else
                            current++;

                        //description.setString("Current effect:  " + effects[current]->getName());
                        DescriptionEffect.setString(Effects[current]->getName());
                        clock.restart();
                        break;

                    default:
                        break;
                }
            }
        }

        // Update the current example
        float x = static_cast<float>(sf::Mouse::getPosition(window).x) / window.getSize().x;
        float y = static_cast<float>(sf::Mouse::getPosition(window).y) / window.getSize().y;
        Effects[current]->update(clock.getElapsedTime().asSeconds(), x, y);

        // Clear the window
        window.clear(sf::Color(255, 128, 0));

        // Draw the current example
        window.draw(*Effects[current]);

        DemoCount.setString("SHADER DEMO:   " + std::string(std::to_string(current + 1)) + "  OF  " + std::string(std::to_string(Effects.size())));

        sf::FloatRect TextLocalBounds = DescriptionEffect.getLocalBounds();
        sf::FloatRect DemoCountLBounds = DemoCount.getLocalBounds();
        sf::FloatRect MouseInfoLBounds = MouseInfo.getLocalBounds();

        DescriptionEffect.setPosition((WindowWidth - TextLocalBounds.width) / 2, 15);
        DescriptionEffect.setFillColor(sf::Color(232, 238, 50));

        DemoCount.setPosition(WindowWidth - DemoCountLBounds.width - 20, WindowHeight - DemoCountLBounds.height - 25);
        DemoCount.setFillColor(sf::Color(0xe9b400ff));

        MouseInfo.setPosition(25, WindowHeight - MouseInfoLBounds.height - 25);
        MouseInfo.setFillColor(sf::Color(0xe9b400ff));

        struct Outline {
          uint32_t Color;
          uint32_t Thickness;
        };

        std::vector<Outline> Outlines{ {0x351804FF, 2},
                                        {0xCD7126FF, 4},
                                        {0x1A0D06FF, 3}
                                      };

        std::vector<Outline> DemoCountOutlines{ {0x351804FF, 2},
                                                 {0xCD7126FF, 2},
                                                 {0x1A0D06FF, 2}
                                               };

        uint32_t MaxThickness{0};

        for (const auto OutlineIterator : Outlines)
          MaxThickness += OutlineIterator.Thickness;

        for (const auto OutlineIterator : Outlines) {
          DescriptionEffect.setOutlineColor(sf::Color(OutlineIterator.Color));
          DescriptionEffect.setOutlineThickness(MaxThickness);

          MaxThickness -= OutlineIterator.Thickness;

          window.draw(DescriptionEffect);
        }

        MaxThickness = 0;

        for (const auto OutlineIterator : DemoCountOutlines)
          MaxThickness += OutlineIterator.Thickness;

        for (const auto OutlineIterator : DemoCountOutlines) {
          DemoCount.setOutlineColor(sf::Color(OutlineIterator.Color));
          DemoCount.setOutlineThickness(MaxThickness);

          MouseInfo.setOutlineColor(sf::Color(OutlineIterator.Color));
          MouseInfo.setOutlineThickness(MaxThickness);

          MaxThickness -= OutlineIterator.Thickness;

          window.draw(DemoCount);
          window.draw(MouseInfo);
        }

        // Finally, display the rendered frame on screen
        window.display();
    }

    // delete the effects
    Effects.clear();

    return EXIT_SUCCESS;
}
