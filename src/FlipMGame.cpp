#include <iostream>

#include "FlipMGame.h"

using namespace std;

// Declare our game instance
FlipMGame game;

FlipMGame::FlipMGame() :
    _scene(NULL),
    _materialTileDefault(NULL),
    _materialTileP1(NULL),
    _materialTileP2(NULL),
    _wireframe(false) {
}


void FlipMGame::initialize() {
    // Config
    string resDir = "res";
    string resBoardsDir = resDir + "/boards";
    string resBoardPathBase = resBoardsDir + "/Board-Basic";
    // Load game scene from file
    _scene = Scene::load((resBoardPathBase + ".scene").c_str());
    // Load tile materials
    _materialTileDefault = Scene::load((resBoardPathBase + ".material#tile_default").c_str());
    initializeMaterial(_scene, NULL, _materialTileDefault);
    _materialTileP1 = Scene::load((resBoardPathBase + ".material#tile_p1").c_str());
    initializeMaterial(_scene, NULL, _materialTileP1);
    _materialTileP2 = Scene::load((resBoardPathBase + ".material#tile_p2").c_str());
    initializeMaterial(_scene, NULL, _materialTileP2);

    initializeCamera();

    _scene->visit(this, &FlipMGame::initializeModel);
}

void FlipMGame::initializeCamera() {
    // Set the aspect ratio for the scene's camera to match the current resolution
    _scene->getActiveCamera()->setAspectRatio(getAspectRatio());
    // Fix camera rotation from Blender export / gameplay3d encoding
    _scene->getActiveCamera()->getNode()->rotateY(MATH_DEG_TO_RAD(-90.0f));
    cout << "Camera: " << _scene->getActiveCamera()->getNode()->getId() << endl;
}

bool FlipMGame::initializeModel(Node* node) {
    Model* model = dynamic_cast<Model*>(node->getDrawable());
    if (model != NULL) {
        unsigned int numParts = model->getMeshPartCount();
        cout << "Model: id=" << node->getId() << ", numParts=" << numParts << endl;
        initializeMaterial(_scene, node, model->getMaterial());
        for (unsigned int partNum = 0; partNum < numParts; partNum++) {
            initializeMaterial(_scene, node, model->getMaterial(partNum));
        }
    }
    return true;
}

void FlipMGame::initializeMaterial(Scene* scene, Node* node, Material* material) {
    if (material != NULL) {
        material->getParameter("u_ambientColor")->bindValue(scene, &Scene::getAmbientColor);
        // TODO: Find all light nodes using visit
        Node* lightNode = scene->findNode("light1");
        if (lightNode != NULL) {
            Light* light = lightNode->getLight();
            if (light != NULL) {
                cout << "\tLight: type=" << light->getLightType() << ", color="
                    << light->getColor().x << ","
                    << light->getColor().y << ","
                    << light->getColor().z
                << endl;
                material->getParameter("u_directionalLightColor[0]")->bindValue(light, &Light::getColor);
                material->getParameter("u_directionalLightDirection[0]")->bindValue(lightNode, &Node::getForwardVectorView);
            }
        }
    }
}

void FlipMGame::finalize() {
    SAFE_RELEASE(_scene);
}

void FlipMGame::update(float elapsedTime) {
    // Rotate model
    // _scene->findNode("box")->rotateY(MATH_DEG_TO_RAD((float)elapsedTime / 1000.0f * 180.0f));
    // _scene->getActiveCamera()->getNode()->rotateY(MATH_DEG_TO_RAD((float)elapsedTime / 5000.0f * 180.0f));
}

void FlipMGame::render(float elapsedTime) {
    // Clear the color and depth buffers
    clear(CLEAR_COLOR_DEPTH, Vector4::zero(), 1.0f, 0);

    // Visit all the nodes in the scene for drawing
    // cout << "======================================================================" << endl;
    _scene->visit(this, &FlipMGame::drawScene);
}

bool FlipMGame::drawScene(Node* node) {
    // cout << "DRAW: " << node->getId() << endl;
    // If the node visited contains a drawable object, draw it
    Drawable* drawable = node->getDrawable(); 
    if (drawable) {
        // cout << "DRAW: " << node->getId() << endl;
        drawable->draw(_wireframe);
    } else {
        // cout << "VISIT: " << node->getId() << endl;
    }

    return true;
}

void FlipMGame::keyEvent(Keyboard::KeyEvent evt, int key) {
    if (evt == Keyboard::KEY_PRESS) {
        switch (key) {
        case Keyboard::KEY_ESCAPE:
            exit();
            break;
        }
    }
}

void FlipMGame::touchEvent(Touch::TouchEvent evt, int x, int y, unsigned int contactIndex) {
    switch (evt) {
    case Touch::TOUCH_PRESS:
        _wireframe = !_wireframe;
        break;
    case Touch::TOUCH_RELEASE:
        break;
    case Touch::TOUCH_MOVE:
        break;
    };
}
