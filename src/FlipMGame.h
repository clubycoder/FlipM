#ifndef FlipMGame_H_
#define FlipMGame_H_

#include "gameplay.h"

using namespace gameplay;

/**
 * Main game class.
 */
class FlipMGame: public Game
{
public:

    /**
     * Constructor.
     */
    FlipMGame();

    /**
     * @see Game::keyEvent
     */
	void keyEvent(Keyboard::KeyEvent evt, int key);
	
    /**
     * @see Game::touchEvent
     */
    void touchEvent(Touch::TouchEvent evt, int x, int y, unsigned int contactIndex);

protected:

    /**
     * @see Game::initialize
     */
    void initialize();
    void initializeCamera();
    bool initializeModel(Node* node);
    void initializeMaterial(Scene* scene, Node* node, Material* material);

    /**
     * @see Game::finalize
     */
    void finalize();

    /**
     * @see Game::update
     */
    void update(float elapsedTime);

    /**
     * @see Game::render
     */
    void render(float elapsedTime);

private:

    /**
     * Draws the scene each frame.
     */
    bool drawScene(Node* node);

    Scene* _scene;
    Material* _materialTileDefault;
    Material* _materialTileP1;
    Material* _materialTileP2;
    bool _wireframe;
};

#endif
