`timescale 1ns / 1ps

module writeback_stage(

    input  logic        MemtoReg,
    input  logic [31:0] memory_data,
    input  logic [31:0] alu_result,

    output logic [31:0] writeback_data

);

assign writeback_data =
        (MemtoReg) ? memory_data : alu_result;

endmodule