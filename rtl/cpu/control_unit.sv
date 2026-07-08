`timescale 1ns / 1ps

module control_unit(

    input  logic [6:0] opcode,

    output logic RegWrite,
    output logic MemRead,
    output logic MemWrite,
    output logic MemtoReg,
    output logic ALUSrc,
    output logic Branch,
    output logic Jump,
    output logic [1:0] ALUOp

);

always_comb begin

    // Default values
    RegWrite = 0;
    MemRead  = 0;
    MemWrite = 0;
    MemtoReg = 0;
    ALUSrc   = 0;
    Branch   = 0;
    Jump     = 0;
    ALUOp    = 2'b00;

    case(opcode)

        // R-Type
        7'b0110011: begin
            RegWrite = 1;
            ALUSrc   = 0;
            ALUOp    = 2'b10;
        end

        // I-Type
        7'b0010011: begin
            RegWrite = 1;
            ALUSrc   = 1;
            ALUOp    = 2'b10;
        end

        // Load
        7'b0000011: begin
            RegWrite = 1;
            MemRead  = 1;
            MemtoReg = 1;
            ALUSrc   = 1;
            ALUOp    = 2'b00;
        end

        // Store
        7'b0100011: begin
            MemWrite = 1;
            ALUSrc   = 1;
            ALUOp    = 2'b00;
        end

        // Branch
        7'b1100011: begin
            Branch = 1;
            ALUOp  = 2'b01;
        end

        // JAL
        7'b1101111: begin
            Jump = 1;
            RegWrite = 1;
        end

        default: begin
        end

    endcase

end

endmodule